import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const bundle = new URL('../web/vendor/nostr-tools-2.25.2.bundle.js', import.meta.url);
const source = await readFile(bundle, 'utf8');
const context = { console, crypto: webcrypto, TextEncoder, TextDecoder, URL, setTimeout, clearTimeout };
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, { timeout: 5000 });
const nostr = context.NostrTools;
assert.ok(nostr?.nip17?.wrapManyEvents, 'local bundle must expose NIP-17');
vm.runInContext(await readFile(new URL('../web/routing.js', import.meta.url), 'utf8'), context, { timeout: 5000 });
const routing = context.LiberdadeNostrRouting;
function signEvent(template, secret) {
  context.eventTemplateJson = JSON.stringify(template);
  context.secretHex = Buffer.from(secret).toString('hex');
  return vm.runInContext('NostrTools.finalizeEvent(JSON.parse(eventTemplateJson), Uint8Array.from(secretHex.match(/.{2}/g), value => parseInt(value, 16)))', context, { timeout: 5000 });
}

const alice = nostr.generateSecretKey();
const bob = nostr.generateSecretKey();
const eve = nostr.generateSecretKey();
const alicePub = nostr.getPublicKey(alice);
const bobPub = nostr.getPublicKey(bob);
const plaintext = `teste-liberdade-${crypto.randomUUID()}`;
const wraps = nostr.nip17.wrapManyEvents(alice, [{ publicKey: bobPub }], plaintext);
assert.equal(wraps.length, 2, 'NIP-17 sends a sender copy and a recipient copy');
for (const wrap of wraps) {
  assert.equal(wrap.kind, 1059);
  assert.equal(nostr.verifyEvent(wrap), true, 'gift wrap signature verifies');
  assert.equal(wrap.content.includes(plaintext), false, 'plaintext must not appear in relay-visible content');
}
const recipientWrap = wraps.find(event => event.tags.some(tag => tag[0] === 'p' && tag[1] === bobPub));
const senderWrap = wraps.find(event => event.tags.some(tag => tag[0] === 'p' && tag[1] === alicePub));
assert.ok(recipientWrap && senderWrap);
const aliceInbox = ['wss://alice-inbox.example'];
const bobInbox = ['wss://bob-inbox.example'];
const routed = routing.planGiftWraps(wraps, alicePub, bobPub, aliceInbox, bobInbox, nostr.verifyEvent);
assert.equal(routed.ready, true, 'valid sender and recipient inbox metadata gives a complete route');
assert.equal([...routed.deliveries.find(item => item.recipient === alicePub).relays].join(','), aliceInbox.join(','));
assert.equal([...routed.deliveries.find(item => item.recipient === bobPub).relays].join(','), bobInbox.join(','));
assert.equal(routing.planGiftWraps(wraps, alicePub, bobPub, aliceInbox, [], nostr.verifyEvent).reason, 'missing-inbox');
const malformed = signEvent({ kind: 10050, pubkey: bobPub, tags: [['relay', 'https://not-websocket.example']], content: '', created_at: Math.floor(Date.now() / 1000) }, bob);
assert.equal([...routing.inboxRelays(malformed, nostr.verifyEvent, value => {
  const url = new URL(value);
  if (url.protocol !== 'wss:') throw new Error('wss required');
  return url.toString().replace(/\/$/, '');
})].join(','), '');
const listEvent = signEvent({ kind: 10050, pubkey: bobPub, tags: [['relay', 'wss://bob-inbox.example/'], ['relay', 'wss://second.example']], content: '', created_at: Math.floor(Date.now() / 1000) }, bob);
assert.equal([...routing.inboxRelays(listEvent, nostr.verifyEvent, value => new URL(value).toString().replace(/\/$/, ''))].join(','), 'wss://bob-inbox.example,wss://second.example');
const unwrapped = nostr.nip17.unwrapEvent(recipientWrap, bob);
assert.equal(unwrapped.kind, 14);
assert.equal(unwrapped.pubkey, alicePub);
assert.equal(unwrapped.content, plaintext);
assert.throws(() => nostr.nip17.unwrapEvent(recipientWrap, eve), 'a non-recipient must not decrypt the message');
assert.equal(nostr.nip17.unwrapEvent(senderWrap, alice).content, plaintext, 'sender can read their own copy');

const password = 'protecao-local-de-teste-42';
const salt = webcrypto.getRandomValues(new Uint8Array(16));
const material = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await webcrypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
const iv = webcrypto.getRandomValues(new Uint8Array(12));
const secret = webcrypto.getRandomValues(new Uint8Array(32));
const encrypted = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, secret);
const restored = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
assert.deepEqual(new Uint8Array(restored), secret, 'password-derived key decrypts local secret');
const digest = createHash('sha256').update(source).digest('hex');
assert.equal(digest, 'a7c4846fde84a0d6ce7596f3fcfc88435d29fdcd616887205ab97f9a16bc6407', 'vendored runtime hash matches recorded provenance');
console.log('PASS: NIP-17 wrap/unwrap, recipient isolation, kind-10050 inbox routing, local AES-GCM, vendor hash');
