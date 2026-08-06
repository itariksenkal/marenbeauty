/**
 * Stops stale dev/preview servers before the browser tests start their own.
 *
 * Why this exists. Playwright is configured never to reuse a running server —
 * a stale one serves the PREVIOUS build, or a module graph it compiled while a
 * file was momentarily broken, and that survives the fix
 * (docs/OPEN-QUESTIONS.md G13). But two things make that hard to guarantee:
 *
 *   - `next dev` spawns child processes that outlive a SIGTERM on Windows;
 *   - Next refuses to start a second dev server in the same project directory
 *     **whatever port it is given**, so a stray on :3000 breaks a test run
 *     on :3101.
 *
 * So this clears both: anything holding the ports, and any `next dev` for this
 * project. Runs as `pretest:e2e`.
 */
import { execFileSync } from 'node:child_process';

const PORTS = [3000, 3100, 3101];
const isWindows = process.platform === 'win32';

function run(file, args) {
  try {
    return execFileSync(file, args, { encoding: 'utf8', stdio: 'pipe' });
  } catch {
    return '';
  }
}

function pidsOnPort(port) {
  if (isWindows) {
    return [
      ...new Set(
        run('netstat', ['-ano', '-p', 'TCP'])
          .split('\n')
          .filter(
            (line) => line.includes(`:${port} `) && /LISTENING/i.test(line),
          )
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((pid) => pid && pid !== '0'),
      ),
    ];
  }
  return run('lsof', ['-ti', `tcp:${port}`])
    .split('\n')
    .map((pid) => pid.trim())
    .filter(Boolean);
}

/** Any `next dev` belonging to this project, on any port. */
function nextDevPids() {
  if (isWindows) {
    const out = run('powershell', [
      '-NoProfile',
      '-Command',
      'Get-CimInstance Win32_Process -Filter "Name=\'node.exe\'" | ' +
        "Where-Object { $_.CommandLine -match 'next(\\\\|/)dist(\\\\|/)bin(\\\\|/)next' -and $_.CommandLine -match 'dev' } | " +
        'ForEach-Object { $_.ProcessId }',
    ]);
    return out
      .split('\n')
      .map((pid) => pid.trim())
      .filter(Boolean);
  }
  return run('pgrep', ['-f', 'next dev'])
    .split('\n')
    .map((pid) => pid.trim())
    .filter(Boolean);
}

function kill(pid) {
  if (isWindows) run('taskkill', ['/PID', pid, '/T', '/F']);
  else run('kill', ['-9', pid]);
}

const stopped = new Set();

for (const port of PORTS) {
  for (const pid of pidsOnPort(port)) {
    if (stopped.has(pid)) continue;
    kill(pid);
    stopped.add(pid);
    console.log(`  stopped pid ${pid} (was holding port ${port})`);
  }
}

for (const pid of nextDevPids()) {
  if (stopped.has(pid)) continue;
  kill(pid);
  stopped.add(pid);
  console.log(`  stopped pid ${pid} (stray next dev)`);
}

/**
 * Killing is asynchronous: a process can still hold its socket for a moment
 * after taskkill returns, and Playwright then fails to bind. Wait until the
 * ports are genuinely free rather than assuming.
 */
function sleep(ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    // Deliberately synchronous — this script runs alone, before the test run.
  }
}

let waited = 0;
while (waited < 6000) {
  const held = PORTS.flatMap((port) => pidsOnPort(port));
  const strays = nextDevPids();
  if (held.length === 0 && strays.length === 0) break;
  for (const pid of [...held, ...strays]) {
    kill(pid);
    stopped.add(pid);
  }
  sleep(400);
  waited += 400;
}

const stillHeld = PORTS.flatMap((port) => pidsOnPort(port));
if (stillHeld.length > 0) {
  console.error(
    `
  ✗ ports still held after ${waited}ms by pid(s) ${stillHeld.join(', ')}.
` +
      `    Stop them by hand — the test run would otherwise fail for a reason
` +
      `    that has nothing to do with the code.
`,
  );
  process.exit(1);
}

console.log(
  stopped.size === 0
    ? '  no stale servers.'
    : `  ${stopped.size} stale server(s) stopped, ports confirmed free.`,
);
