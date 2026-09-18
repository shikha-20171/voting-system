import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('\x1b[36m%s\x1b[0m', `
==================================================================
  🗳️  VIAP - Voter Intelligent Application Platform
==================================================================
  Starting Backend (Fastify on :4000) & Frontend (Vite on :3000)...
==================================================================
`);

// Spawn Backend
const backend = spawn('npm', ['--prefix', 'backend', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

// Spawn Frontend
const frontend = spawn('npm', ['--prefix', 'frontend', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('\n\x1b[33mStopping VIAP services...\x1b[0m');
  try {
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
  } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

backend.on('error', (err) => {
  console.error('\x1b[31mBackend process error:\x1b[0m', err);
});

frontend.on('error', (err) => {
  console.error('\x1b[31mFrontend process error:\x1b[0m', err);
});
