// Build statico di Next per l'app desktop Tauri.
// `MIRU_DESKTOP=1` attiva `output: 'export'` e disattiva le route API
// (vedi next.config.mjs): nel desktop la logica gira dentro la webview.
import { spawnSync } from 'node:child_process'

const env = { ...process.env, MIRU_DESKTOP: '1', NEXT_PUBLIC_MIRU_DESKTOP: '1' }

const result = spawnSync('npx', ['next', 'build'], {
  stdio: 'inherit',
  env,
  shell: true,
})

process.exit(result.status ?? 1)
