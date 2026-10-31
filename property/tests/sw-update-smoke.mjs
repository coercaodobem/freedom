import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const origin = 'https://coercaodobem.github.io';
const scope = `${origin}/property/`;
const listeners = {};
const deleted = [];
let requests = [];
let currentCache;
let claimed = false;
const context = {
  URL,
  Request: class extends Request { constructor(path, options) { super(new URL(path, scope), options); } },
  caches: {
    async open(name) { currentCache = name; return { async addAll(items) { requests = items; } }; },
    async keys() { return [currentCache, 'property-shell-v5', 'liberdade-shell-v4', 'another-app-data']; },
    async delete(name) { deleted.push(name); return true; }
  },
  self: { location: { origin }, addEventListener(name, listener) { listeners[name] = listener; },
    async skipWaiting() {}, clients: { async claim() { claimed = true; } } }
};
vm.createContext(context);
vm.runInContext(await readFile(new URL('../web/sw.js', import.meta.url), 'utf8'), context);
let pending;
listeners.install({ waitUntil(promise) { pending = promise; } });
await pending;
assert.ok(requests.length >= 14);
assert.ok(requests.every(request => request.cache === 'reload'), 'install must refresh stale browser HTTP cache');
const cachedUrls = new Set(requests.map(request => request.url));
for (const page of ['index.html', 'about.html']) {
  const html = await readFile(new URL(`../web/${page}`, import.meta.url), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) {
    assert.ok(cachedUrls.has(new URL(match[1], scope).href), `offline shell covers ${match[1]}`);
  }
}
listeners.activate({ waitUntil(promise) { pending = promise; } });
await pending;
assert.deepEqual(deleted.sort(), ['liberdade-shell-v4', 'property-shell-v5']);
assert.equal(claimed, true);
console.log('PASS: PWA install reloads all local assets, covers versioned HTML references, preserves unrelated caches');
