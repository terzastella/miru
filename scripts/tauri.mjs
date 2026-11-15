// Lancia la CLI Tauri dentro l'environment MSVC (vcvars64).
// Su questa macchina Rust non trova `link.exe` da solo: i Build Tools ci sono
// ma il linker non è nel PATH, quindi prepariamo l'ambiente come farebbe
// "Developer PowerShell for VS".
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const VS_ROOTS = [
  'C:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools',
  'C:/Program Files/Microsoft Visual Studio/2022/BuildTools',
  'C:/Program Files (x86)/Microsoft Visual Studio/2022/Community',
  'C:/Program Files/Microsoft Visual Studio/2022/Community',
  'C:/Program Files (x86)/Microsoft Visual Studio/18/BuildTools',
  'C:/Program Files/Microsoft Visual Studio/18/BuildTools',
]

function findVcvars() {
  for (const root of VS_ROOTS) {
    const candidate = join(root, 'VC/Auxiliary/Build/vcvars64.bat')
    if (existsSync(candidate)) return candidate
  }
  return null
}

const args = process.argv.slice(2)
const command = ['npx', 'tauri', ...args].join(' ')
const vcvars = findVcvars()

if (!vcvars) {
  console.warn('[miru] vcvars64.bat non trovato: provo senza ambiente MSVC')
  const direct = spawnSync(command, { stdio: 'inherit', shell: true })
  process.exit(direct.status ?? 1)
}

const dir = mkdtempSync(join(tmpdir(), 'miru-tauri-'))
const script = join(dir, 'run.bat')
writeFileSync(
  script,
  ['@echo off', `call "${vcvars}" >nul`, command, 'exit /b %ERRORLEVEL%'].join('\r\n'),
)

const result = spawnSync('cmd.exe', ['/c', script], { stdio: 'inherit' })
rmSync(dir, { recursive: true, force: true })
process.exit(result.status ?? 1)
