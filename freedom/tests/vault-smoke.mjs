import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = { console, crypto: webcrypto, TextEncoder, TextDecoder, URL, setTimeout, clearTimeout, btoa, atob };
context.window = context;
vm.createContext(context);
for (const file of ['../web/vendor/nostr-tools-2.25.2.bundle.js', '../web/vault.js']) {
  vm.runInContext(await readFile(new URL(file, import.meta.url), 'utf8'), context, { timeout: 5000 });
}
const N = context.NostrTools;
const V = context.LiberdadeVault;
const secret = N.generateSecretKey();
const pubkey = N.getPublicKey(secret);
const password = 'senha-teste-local-que-nao-e-real';
const vault = await V.createVault(secret, password, true, N.getPublicKey);
assert.equal(vault.pubkey, pubkey);
assert.equal(vault.cipher.includes(Buffer.from(secret).toString('base64')), false);
assert.deepEqual(Buffer.from(await V.unlockVault(vault, password, N.getPublicKey)), Buffer.from(secret));
await assert.rejects(() => V.unlockVault(vault, 'senha-errada-qualquer', N.getPublicKey), /Senha incorreta/);
const restored = await V.autoUnlock(vault, N.getPublicKey);
assert.deepEqual(Buffer.from(restored), Buffer.from(secret));
const backup = V.exportBackup(vault);
assert.equal(backup.format, 'liberdade-encrypted-key-v1');
assert.equal('session' in backup, false);
assert.deepEqual(Buffer.from(await V.unlockVault(backup, password, N.getPublicKey)), Buffer.from(secret));
const notRemembered = await V.createVault(secret, password, false, N.getPublicKey);
assert.equal(await V.autoUnlock(notRemembered, N.getPublicKey), null);
console.log('PASS: criação, senha errada, desbloqueio, sessão persistente e backup cifrado');
