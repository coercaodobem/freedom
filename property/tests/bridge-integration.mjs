import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const [sourceRelay, targetRelay] = process.argv.slice(2);
assert.ok(sourceRelay && targetRelay && sourceRelay !== targetRelay, 'provide distinct source and target relay URLs');

const context = { console, crypto: webcrypto, TextEncoder, TextDecoder, URL, setTimeout, clearTimeout };
context.window = context;
vm.createContext(context);
vm.runInContext(await readFile(new URL('../web/vendor/nostr-tools-2.25.2.bundle.js', import.meta.url), 'utf8'), context, { timeout: 5000 });
vm.runInContext(await readFile(new URL('../web/forwarding.js', import.meta.url), 'utf8'), context, { timeout: 5000 });
const nostr = context.NostrTools;
const bridge = context.PropertyRelayBridge.createBridge(event => {
  context.eventJson = JSON.stringify(event);
  return vm.runInContext('NostrTools.verifyEvent(JSON.parse(eventJson))', context, { timeout: 5000 });
});

function signEvent(template, secret) {
  context.eventTemplateJson = JSON.stringify(template);
  context.secretHex = Buffer.from(secret).toString('hex');
  return vm.runInContext('NostrTools.finalizeEvent(JSON.parse(eventTemplateJson), Uint8Array.from(secretHex.match(/.{2}/g), value => parseInt(value, 16)))', context, { timeout: 5000 });
}
function openSocket(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timer = setTimeout(() => { socket.close(); reject(new Error(`timeout conectando em ${url}`)); }, 5000);
    socket.addEventListener('open', () => { clearTimeout(timer); resolve(socket); }, { once: true });
    socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error(`falha ao conectar em ${url}`)); }, { once: true });
  });
}
function waitFrame(socket, predicate, timeout = 7000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.removeEventListener('message', listener); reject(new Error('timeout aguardando quadro do relay')); }, timeout);
    function listener(event) {
      let frame;
      try { frame = JSON.parse(event.data); } catch { return; }
      if (!predicate(frame)) return;
      clearTimeout(timer); socket.removeEventListener('message', listener); resolve(frame);
    }
    socket.addEventListener('message', listener);
  });
}

const alice = nostr.generateSecretKey();
const recipient = nostr.generateSecretKey();
const recipientPubkey = nostr.getPublicKey(recipient);
const publicEvent = signEvent({ kind: 1, pubkey: nostr.getPublicKey(alice), content: `bridge-${crypto.randomUUID()}`, tags: [], created_at: Math.floor(Date.now() / 1000) }, alice);
const privateWrap = nostr.nip17.wrapManyEvents(alice, [{ publicKey: recipientPubkey }], `private-${crypto.randomUUID()}`).find(event => event.tags.some(tag => tag[0] === 'p' && tag[1] === recipientPubkey));
const source = await openSocket(sourceRelay);
const destination = await openSocket(targetRelay);
try {
  const sourceSubscription = `source-${crypto.randomUUID()}`;
  const sourceQuery = waitFrame(source, frame => frame[0] === 'EOSE' && frame[1] === sourceSubscription);
  source.send(JSON.stringify(['REQ', sourceSubscription, { kinds: [1], since: Math.floor(Date.now() / 1000) - 5 }]));
  await sourceQuery;
  const destinationSubscription = `target-${crypto.randomUUID()}`;
  const destinationQuery = waitFrame(destination, frame => frame[0] === 'EOSE' && frame[1] === destinationSubscription);
  destination.send(JSON.stringify(['REQ', destinationSubscription, { kinds: [1], since: Math.floor(Date.now() / 1000) - 5 }]));
  await destinationQuery;

  const sourceEvent = waitFrame(source, frame => frame[0] === 'EVENT' && frame[1] === sourceSubscription && frame[2]?.id === publicEvent.id);
  const sourceAck = waitFrame(source, frame => frame[0] === 'OK' && frame[1] === publicEvent.id);
  source.send(JSON.stringify(['EVENT', publicEvent]));
  const [received] = await Promise.all([sourceEvent, sourceAck]);
  assert.equal(received[2].id, publicEvent.id);
  const destinations = bridge.targets(received[2], sourceRelay, [sourceRelay, targetRelay]);
  assert.deepEqual(Array.from(destinations), [targetRelay]);

  const targetEvent = waitFrame(destination, frame => frame[0] === 'EVENT' && frame[1] === destinationSubscription && frame[2]?.id === publicEvent.id);
  const targetAck = waitFrame(destination, frame => frame[0] === 'OK' && frame[1] === publicEvent.id);
  destination.send(JSON.stringify(['EVENT', received[2]]));
  const [stored] = await Promise.all([targetEvent, targetAck]);
  assert.equal(stored[2].id, publicEvent.id, 'destination relay serves the bridged event');
  assert.deepEqual(Array.from(bridge.targets(stored[2], targetRelay, [sourceRelay, targetRelay])), [], 'echo from destination cannot create a relay loop');

  const since = Math.floor(Date.now() / 1000) - 173100;
  const sourcePrivateSubscription = `private-source-${crypto.randomUUID()}`;
  const sourcePrivateQuery = waitFrame(source, frame => frame[0] === 'EOSE' && frame[1] === sourcePrivateSubscription);
  source.send(JSON.stringify(['REQ', sourcePrivateSubscription, { kinds: [1059], '#p': [recipientPubkey], since }]));
  await sourcePrivateQuery;
  const targetPrivateSubscription = `private-target-${crypto.randomUUID()}`;
  const targetPrivateQuery = waitFrame(destination, frame => frame[0] === 'EOSE' && frame[1] === targetPrivateSubscription);
  destination.send(JSON.stringify(['REQ', targetPrivateSubscription, { kinds: [1059], '#p': [recipientPubkey], since }]));
  await targetPrivateQuery;
  const sourceWrap = waitFrame(source, frame => frame[0] === 'EVENT' && frame[1] === sourcePrivateSubscription && frame[2]?.id === privateWrap.id);
  const sourceWrapAck = waitFrame(source, frame => frame[0] === 'OK' && frame[1] === privateWrap.id);
  source.send(JSON.stringify(['EVENT', privateWrap]));
  const [receivedWrap] = await Promise.all([sourceWrap, sourceWrapAck]);
  const privateTargets = bridge.privateTargets(receivedWrap[2], sourceRelay, [targetRelay], recipientPubkey);
  assert.deepEqual(Array.from(privateTargets), [targetRelay], 'NIP-17 envelope routes only to the recipient inbox list supplied by the client');
  const targetWrap = waitFrame(destination, frame => frame[0] === 'EVENT' && frame[1] === targetPrivateSubscription && frame[2]?.id === privateWrap.id);
  const targetWrapAck = waitFrame(destination, frame => frame[0] === 'OK' && frame[1] === privateWrap.id);
  destination.send(JSON.stringify(['EVENT', receivedWrap[2]]));
  const [storedWrap] = await Promise.all([targetWrap, targetWrapAck]);
  assert.equal(storedWrap[2].id, privateWrap.id, 'recipient inbox relay stores and serves the encrypted wrap');
  assert.deepEqual(Array.from(bridge.privateTargets(storedWrap[2], targetRelay, [sourceRelay], recipientPubkey)), [], 'a repeated wrap cannot loop back');
  console.log(`PASS: signed public event replicated ${sourceRelay}→${targetRelay}; encrypted NIP-17 wrap reached only the recipient inbox relay; relay echo ignored`);
} finally {
  source.send(JSON.stringify(['CLOSE', `source-unused-${crypto.randomUUID()}`]));
  source.close();
  destination.close();
}
