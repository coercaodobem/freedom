import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = { console, crypto: webcrypto, TextEncoder, TextDecoder, URL, setTimeout, clearTimeout };
context.window = context;
vm.createContext(context);
for (const file of ['vendor/nostr-tools-2.25.2.bundle.js', 'nano.js', 'marketplace.js']) {
  vm.runInContext(await readFile(new URL(`../web/${file}`, import.meta.url), 'utf8'), context, { timeout: 5000 });
}
const { LiberdadeNanoUnits: nano, LiberdadeMarketplace: market } = context;
const N = context.NostrTools;

function sign(template, secret) {
  context.marketplaceTemplateJson = JSON.stringify(template);
  context.marketplaceSecretHex = Buffer.from(secret).toString('hex');
  return vm.runInContext('NostrTools.finalizeEvent(JSON.parse(marketplaceTemplateJson), Uint8Array.from(marketplaceSecretHex.match(/.{2}/g), value => parseInt(value, 16)))', context, { timeout: 5000 });
}

assert.deepEqual(JSON.parse(JSON.stringify(market.parsePrice('0,25 XNO', nano))), {
  price: 0.25, currency: 'XNO', raw: '250000000000000000000000000000'
});
assert.equal(market.parsePrice('0.00000001', nano).raw, '10000000000000000000000');
assert.equal(market.displayPrice({ price: 0.25, currency: 'XNO', price_raw: '250000000000000000000000000000' }, nano), '0.25 XNO');
assert.equal(market.displayPrice({ price: 1.5, currency: 'XNO', price_raw: 'not-raw' }, nano), '1.5 XNO');
assert.equal(market.displayPrice({ price: 50, currency: 'USD' }, nano), '50 USD');
assert.equal(market.safeExternalImageUrl('https://example.org/image.png'), 'https://example.org/image.png');
for (const unsafe of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'http://example.org/image.png', 'https://user:pass@example.org/image.png', 'https://127.0.0.1/image.png', 'https://localhost/image.png']) {
  assert.equal(market.safeExternalImageUrl(unsafe), '', `rejects unsafe external image link: ${unsafe}`);
}
for (const invalid of ['-1', '1e3', '0.000000001', '2 USD', '', '9007199254740992 XNO', '9007199254740991.1 XNO']) {
  assert.throws(() => market.parsePrice(invalid, nano), undefined, `rejects invalid marketplace price: ${invalid}`);
}

const seller = N.generateSecretKey();
const sellerPub = N.getPublicKey(seller);
const other = N.generateSecretKey();
const d = 'product-123e4567-e89b-42d3-a456-426614174000';
const now = Math.floor(Date.now() / 1000);
function product(createdAt, name, id = d, author = sellerPub, secret = seller) {
  return sign({ kind: 30018, pubkey: author, created_at: createdAt, tags: [['d', d]], content: JSON.stringify({
    id, stall_id: 'stall-1', name, description: '', images: [], currency: 'XNO', price: 0.25,
    price_raw: '250000000000000000000000000000', quantity: null, specs: [], shipping: []
  }) }, secret);
}
const original = product(now, 'Oferta antiga');
const updated = product(now + 1, 'Oferta editada');
assert.equal(market.productAddress(updated), `30018:${sellerPub}:${d}`, 'edit keeps the addressable product ID stable');
assert.equal(market.selectActiveProducts([original, updated], N.verifyEvent).length, 1);
assert.equal(market.selectActiveProducts([original, updated], N.verifyEvent)[0].data.name, 'Oferta editada');
const deletionTemplate = market.makeProductDeletion(updated);
assert.deepEqual(JSON.parse(JSON.stringify(deletionTemplate.tags)), [
  ['a', `30018:${sellerPub}:${d}`], ['e', updated.id], ['k', '30018']
]);
const deletion = sign({ ...deletionTemplate, pubkey: sellerPub, created_at: now + 2 }, seller);
assert.equal(market.selectActiveProducts([updated, deletion], N.verifyEvent).length, 0, 'author deletion hides the addressable listing');
const otherAuthorDeletion = sign({ ...deletionTemplate, pubkey: N.getPublicKey(other), created_at: now + 2 }, other);
assert.equal(market.selectActiveProducts([updated, otherAuthorDeletion], N.verifyEvent).length, 1, 'another author cannot delete a listing');
const earlyDeletion = sign({ ...deletionTemplate, pubkey: sellerPub, created_at: now }, seller);
assert.equal(market.selectActiveProducts([updated, earlyDeletion], N.verifyEvent).length, 1, 'a deletion request cannot hide a newer update');
const mismatchedId = product(now + 3, 'ID inconsistente', 'different-id');
assert.equal(market.selectActiveProducts([mismatchedId], N.verifyEvent).length, 0, 'content ID must match the addressable d tag');
assert.equal(market.makeProductDeletion({ ...updated, tags: [['d', 'one'], ['d', 'two']] }), null, 'ambiguous product IDs cannot be withdrawn');

console.log('PASS: marketplace raw exato, edição addressable, exclusão NIP-09 por autoria, versão e ID');
