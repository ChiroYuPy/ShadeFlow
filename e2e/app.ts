import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import puppeteer, { type Browser, type ElementHandle, type Page } from 'puppeteer-core'
import { createServer, type ViteDevServer } from 'vite'

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** The editor running in a real browser, as a user would see it. */
export class App {
  /** Uncaught errors and console errors since the last `open()`. */
  problems: string[] = []

  readonly page: Page
  private browser: Browser
  private server: ViteDevServer
  private profile: string
  private url: string

  private constructor(page: Page, browser: Browser, server: ViteDevServer, profile: string, url: string) {
    this.page = page
    this.browser = browser
    this.server = server
    this.profile = profile
    this.url = url
  }

  static async launch(): Promise<App> {
    const executablePath = CHROME_CANDIDATES.find((p) => p && existsSync(p))
    if (!executablePath) throw new Error('No Chrome/Chromium found: set CHROME_PATH')

    const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'silent' })
    await server.listen()
    const url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/`

    // A visible folder in the home directory: snap-packaged Chromium cannot use /tmp or hidden folders.
    const profile = mkdtempSync(join(homedir(), 'shadeflow-e2e-'))
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      userDataDir: profile,
      args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
      defaultViewport: { width: 1400, height: 800 },
    })
    const page = await browser.newPage()
    const app = new App(page, browser, server, profile, url)
    page.on('pageerror', (e) => app.problems.push(String(e)))
    page.on('console', (m) => m.type() === 'error' && app.problems.push(m.text()))
    return app
  }

  /** A fresh session: empty storage, default example loaded and measured. */
  async open() {
    if (this.page.url() !== this.url) await this.page.goto(this.url, { waitUntil: 'domcontentloaded' })
    await this.page.evaluate(() => localStorage.clear())
    await this.reload()
    this.problems = []
  }

  async reload() {
    await this.page.reload({ waitUntil: 'domcontentloaded' })
    await this.page.waitForSelector('.react-flow__node')
    await sleep(500)
  }

  async close() {
    await this.browser.close().catch(() => {})
    await this.server.close()
    rmSync(this.profile, { recursive: true, force: true })
  }

  sleep = sleep

  // ── Reading the screen ───────────────────────────────────────────────

  nodeCount() {
    return this.page.evaluate(() => document.querySelectorAll('.react-flow__node').length)
  }

  edgeCount() {
    return this.page.evaluate(() => document.querySelectorAll('.react-flow__edge').length)
  }

  /** Titles of the node headers on the canvas (notes have none). */
  nodeTitles() {
    return this.page.evaluate(() =>
      [...document.querySelectorAll('.react-flow__node .bg-node-header')].map((h) => h.textContent?.trim() ?? ''),
    )
  }

  menuItems() {
    return this.page.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].map((e) => e.textContent?.trim() ?? ''))
  }

  /** Text of the node-palette entries currently listed. */
  paletteItems() {
    return this.page.evaluate(() =>
      [...document.querySelectorAll('[data-palette-item]')]
        .filter((i) => (i as HTMLElement).offsetParent)
        .map((i) => i.querySelector('.font-medium')?.textContent ?? ''),
    )
  }

  // ── Acting ───────────────────────────────────────────────────────────

  /** The header of the node with this title. */
  async header(title: string): Promise<ElementHandle> {
    const handle = await this.page.evaluateHandle(
      (t) => [...document.querySelectorAll('.react-flow__node .bg-node-header')].find((h) => h.textContent?.trim() === t) ?? null,
      title,
    )
    const el = handle.asElement() as ElementHandle<Element> | null
    if (!el) throw new Error(`No node titled "${title}"`)
    return el
  }

  async rightClickNode(title: string) {
    const box = (await (await this.header(title)).boundingBox())!
    await this.page.mouse.click(box.x + 30, box.y + box.height / 2, { button: 'right' })
    await this.page.waitForSelector('[role=menu]')
  }

  async clickNode(title: string) {
    const box = (await (await this.header(title)).boundingBox())!
    await this.page.mouse.click(box.x + 30, box.y + box.height / 2)
    await sleep(150)
  }

  async clickMenuItem(text: string) {
    const ok = await this.page.evaluate((t) => {
      const item = [...document.querySelectorAll<HTMLElement>('[role=menuitem]')].find((e) => e.textContent?.includes(t))
      item?.click()
      return !!item
    }, text)
    if (!ok) throw new Error(`No menu item "${text}"`)
    await sleep(250)
  }

  async key(key: string, modifiers: ('Control' | 'Shift')[] = []) {
    for (const m of modifiers) await this.page.keyboard.down(m)
    await this.page.keyboard.press(key as never)
    for (const m of modifiers.reverse()) await this.page.keyboard.up(m)
    await sleep(150)
  }

  async openPalette() {
    await this.key('A', ['Shift'])
    await this.page.waitForSelector('[data-palette]')
    await sleep(250)
  }

  /** Add a node by name with the palette. */
  async addNode(name: string) {
    await this.openPalette()
    await this.page.keyboard.type(name)
    await sleep(150)
    await this.page.keyboard.press('Enter')
    await sleep(300)
  }
}
