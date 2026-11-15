// Copia l'eseguibile compilato in `dist/MIRU.exe`: quello è l'artefatto
// portabile (nessuna installazione, nessun Node.js richiesto).
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const source = join('src-tauri', 'target', 'release', 'MIRU.exe')

if (!existsSync(source)) {
  console.error(`exe non trovato: ${source}`)
  console.error('Esegui prima: npm run desktop:build')
  process.exit(1)
}

mkdirSync('dist', { recursive: true })
const target = join('dist', 'MIRU.exe')
copyFileSync(source, target)

const mb = (statSync(target).size / (1024 * 1024)).toFixed(1)
console.log(`portabile pronto: ${target} (${mb} MB)`)
