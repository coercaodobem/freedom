import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const testRoot = await mkdtemp(join(tmpdir(), 'Property relay '));
const port = 17457;
const env = { ...process.env, PROPERTY_RELAY_HOST: '127.0.0.1', PROPERTY_RELAY_PORT: String(port),
  PROPERTY_RELAY_DATA_DIR: join(testRoot, 'dados persistentes'), PROPERTY_RELAY_CONFIG_DIR: join(testRoot, 'config privada') };
const windows = process.platform === 'win32';
const command = windows ? 'powershell.exe' : 'bash';
const args = windows ? ['-NoProfile', '-File', join(root, 'property/relay/start.ps1')] : [join(root, 'property/relay/start.sh')];
let child;
let diagnostic = '';
async function stop() {
  if (!child || child.exitCode !== null) return;
  if (windows) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-child.pid, 'SIGTERM'); } catch {} }
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 5000))]);
}
async function start() {
  child = spawn(command, args, { env, cwd: root, detached: !windows, stdio: ['ignore', 'pipe', 'pipe'] });
  child.on('error', error => { diagnostic += error.message; });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { diagnostic = (diagnostic + data.toString()).slice(-10000); });
  for (let attempt = 0; attempt < 120; attempt++) {
    if (child.exitCode !== null) throw new Error(`Relay exited ${child.exitCode}: ${diagnostic}`);
    const ready = await new Promise(resolve => {
      const socket = net.connect(port, '127.0.0.1');
      socket.setTimeout(500);
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => { socket.destroy(); resolve(false); });
      socket.once('timeout', () => { socket.destroy(); resolve(false); });
    });
    if (ready) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Relay not ready: ${diagnostic}`);
}
async function queryEvents() {
  const socket = new WebSocket(`ws://127.0.0.1:${port}`);
  try {
    return await new Promise((resolve, reject) => {
      let count = 0;
      const timer = setTimeout(() => reject(new Error('Persistência: timeout')), 10000);
      socket.addEventListener('open', () => socket.send(JSON.stringify(['REQ', 'persisted', { kinds: [10050, 1059, 30018], limit: 100 }])));
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Persistência: conexão falhou')); });
      socket.addEventListener('message', event => {
        const frame = JSON.parse(event.data);
        if (frame[0] === 'EVENT') count++;
        if (frame[0] === 'EOSE') { clearTimeout(timer); resolve(count); }
      });
    });
  } finally { socket.close(); }
}
try {
  await start();
  const test = spawnSync(process.execPath, [join(root, 'property/tests/relay-integration.mjs'), `ws://127.0.0.1:${port}`], { encoding: 'utf8', timeout: 90000 });
  assert.equal(test.status, 0, `${test.stdout}\n${test.stderr}\n${diagnostic}`);
  process.stdout.write(test.stdout);
  const before = await queryEvents();
  assert.ok(before >= 3, 'events persisted by the integration suite');
  await stop();
  await start();
  assert.equal(await queryEvents(), before, 'same events remain after native relay restart');
  console.log(`PASS: native ${process.platform}/${process.arch}, bundled Java, NIP-17/NIP-15 BTC/XMR/XNO and persistence across restart`);
} finally {
  await stop();
  await rm(testRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
}
