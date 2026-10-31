import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const context = {};
context.window = context;
vm.createContext(context);
vm.runInContext(await readFile(new URL('../web/nano.js', import.meta.url), 'utf8'), context, { timeout: 5000 });
const units = context.PropertyNanoUnits;
const oneXno = '1000000000000000000000000000000';
const oneRawInXno = `0.${'0'.repeat(29)}1`;

assert.equal(units.RAW_PER_XNO, oneXno);
assert.equal(units.xnoToRaw('1'), oneXno);
assert.equal(units.xnoToRaw('0,25'), '250000000000000000000000000000');
assert.equal(units.xnoToRaw(oneRawInXno), '1');
assert.equal(units.rawToXno('1'), oneRawInXno);
assert.equal(units.rawToXno(units.xnoToRaw('12345678901234567890.12345678901234567890123456789')),
  '12345678901234567890.12345678901234567890123456789');
assert.equal(units.rawToXno(1n), oneRawInXno);
for (const invalid of ['', '-1', '+1', '1e-4', '1.0000000000000000000000000000001', '1,2.3', 'NaN', 'Infinity']) {
  assert.throws(() => units.xnoToRaw(invalid), undefined, `rejects invalid XNO: ${invalid}`);
}
for (const invalid of ['', '-1', '+1', '1.0', '01', '1e30', 1]) {
  assert.throws(() => units.rawToXno(invalid), undefined, `rejects invalid raw: ${invalid}`);
}
console.log('PASS: XNO/raw exact integer conversion, 1 raw/1 XNO boundaries, comma decimals and invalid inputs');
