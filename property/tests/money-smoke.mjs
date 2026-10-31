import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = { window: {} };
vm.createContext(context);
vm.runInContext(await readFile(new URL('../web/money.js', import.meta.url), 'utf8'), context);
const M = context.window.PropertyMoney;
for (const [currency, scale, max] of [
  ['XNO', 30, (1n << 128n) - 1n], ['XMR', 12, (1n << 64n) - 1n]
]) {
  assert.equal(M.toAtomic('1', currency), (10n ** BigInt(scale)).toString());
  assert.equal(M.toAtomic(`0.${'0'.repeat(scale - 1)}1`, currency), '1');
  assert.equal(M.fromAtomic('1', currency), `0.${'0'.repeat(scale - 1)}1`);
  assert.equal(M.toAtomic('0,25', currency), (10n ** BigInt(scale) / 4n).toString());
  assert.equal(M.toAtomic(M.fromAtomic(max.toString(), currency), currency), max.toString());
  assert.throws(() => M.fromAtomic((max + 1n).toString(), currency));
  assert.throws(() => M.toAtomic(`0.${'0'.repeat(scale)}1`, currency));
  for (const invalid of ['-1', '1e3', 'NaN', '', '.5', '0.']) assert.throws(() => M.toAtomic(invalid, currency));
  for (const invalid of ['01', '-1', '0.1', 1, '1'.repeat(100)]) assert.throws(() => M.validateAtomic(invalid, currency));
}
assert.throws(() => M.toAtomic('1', 'USD'));
assert.throws(() => M.toAtomic('1', '__proto__'));
console.log('PASS: XMR/piconero e XNO/raw exatos, limites, precisão e rejeição de moedas/unidades inválidas');
