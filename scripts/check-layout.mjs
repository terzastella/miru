// Verifica layout responsive della build web con Edge (nessun browser da scaricare).
// Uso: node scripts/check-layout.mjs http://localhost:3100
import puppeteer from 'puppeteer-core'

const url = process.argv[2] ?? 'http://localhost:3100'
const sizes = [
  [1920, 1040],
  [1440, 900],
  [1280, 860],
  [1024, 700],
  [900, 640],
]

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--no-sandbox'],
})

const page = await browser.newPage()
await page.goto(`${url}/explore/`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 4000))

for (const [width, height] of sizes) {
  await page.setViewport({ width, height })
  await page.evaluate(() => window.scrollTo(0, 0))
  await new Promise((r) => setTimeout(r, 900))

  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflowing: [...document.querySelectorAll('*')]
      .filter((el) => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.right > window.innerWidth + 1
      })
      .slice(0, 4)
      .map((el) => `${el.tagName}.${String(el.className).slice(0, 40)}`)
  }))
  const ok = metrics.scrollWidth <= metrics.innerWidth
  console.log(
    `${width}x${height}: ${ok ? 'OK' : 'OVERFLOW'} scrollWidth=${metrics.scrollWidth} ${metrics.overflowing.join(' | ')}`,
  )
  await page.screenshot({ path: `layout-${width}.png` })
}

// dettaglio aperto: clic sulla prima card (attende che Esplora carichi i risultati)
await page.setViewport({ width: 1024, height: 700 })
let card = null
for (let i = 0; i < 25 && !card; i += 1) {
  await new Promise((r) => setTimeout(r, 1000))
  card = await page.$('main [class*="aspect-2/3"]')
}
const cards = await page.$$eval('main [class*="aspect-2/3"]', (els) => els.length)
console.log('card trovate:', cards)
if (card) {
  await page.evaluate((el) => el.scrollIntoView({ block: 'center' }), card)
  await new Promise((r) => setTimeout(r, 600))
  const box = await card.boundingBox()
  if (box) await page.mouse.click(box.x + box.width / 2, box.y + 20)
  await new Promise((r) => setTimeout(r, 1500))
  const dialog = await page.evaluate(() => {
    const el = document.querySelector('[role="dialog"], [data-slot="dialog-content"]')
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return { width: Math.round(rect.width), right: Math.round(rect.right), viewport: window.innerWidth }
  })
  console.log('dialog@1024:', JSON.stringify(dialog))
  await page.screenshot({ path: 'layout-dialog-1024.png' })
} else {
  console.log('card non trovata')
}

await browser.close()
