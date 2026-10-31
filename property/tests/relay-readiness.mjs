import assert from 'node:assert/strict';

const urls = process.argv.slice(2);
assert.ok(urls.length > 0, 'provide at least one local relay URL');
assert.ok(urls.every(value => /^ws:\/\/(?:127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(value)), 'readiness probe accepts loopback URLs only');

async function check(url) {
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    let opened = false;
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error(`timeout opening local relay ${url}`));
    }, 2500);
    socket.addEventListener('open', () => {
      opened = true;
      socket.close();
    }, { once: true });
    socket.addEventListener('close', () => {
      clearTimeout(timeout);
      if (opened) resolve();
      else reject(new Error(`local relay closed before WebSocket opened: ${url}`));
    }, { once: true });
    socket.addEventListener('error', () => {
      clearTimeout(timeout);
      reject(new Error(`cannot open local relay ${url}`));
    }, { once: true });
  });
}

await Promise.all(urls.map(check));
console.log(`PASS: WebSocket readiness for ${urls.length} loopback relay(s)`);
