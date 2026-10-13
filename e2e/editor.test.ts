import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { EXAMPLES } from '../src/demo/examples'
import type { ElementHandle } from 'puppeteer-core'
import { App } from './app'

let app: App

beforeAll(async () => {
  app = await App.launch()
})
afterAll(() => app.close())
beforeEach(() => app.open())
afterEach(() => {
  // Whatever a test did, the page must not have thrown or logged errors.
  expect(app.problems).toEqual([])
})

/** Zoom factor of the canvas. */
const zoomLevel = () =>
  app.page.evaluate(() => {
    const t = (document.querySelector('.react-flow__viewport') as HTMLElement).style.transform
    return Number(/scale\(([\d.]+)\)/.exec(t)?.[1] ?? 1)
  })

describe('startup', () => {
  it('draws node previews square, like the result', async () => {
    const box = await app.page.$eval('.react-flow__node canvas', (c) => {
      const r = c.getBoundingClientRect()
      return { ratio: r.width / r.height, pixels: (c as HTMLCanvasElement).width / (c as HTMLCanvasElement).height }
    })
    expect(box.ratio).toBeCloseTo(1, 1)
    expect(box.pixels).toBe(1)
  })

  it('shows the default example with live previews', async () => {
    expect(await app.nodeCount()).toBeGreaterThan(5)
    expect(await app.nodeTitles()).toContain('Output')
    // main preview + at least one node preview, each a real canvas
    expect(await app.page.evaluate(() => document.querySelectorAll('canvas').length)).toBeGreaterThan(1)
    expect(await app.page.evaluate(() => document.body.textContent)).not.toContain('Cannot display')
  })

  it('keeps the project across a reload', async () => {
    const before = await app.nodeCount()
    await app.addNode('Sin')
    expect(await app.nodeCount()).toBe(before + 1)
    await app.sleep(700) // autosave is debounced
    await app.reload()
    expect(await app.nodeCount()).toBe(before + 1)
  })
})

describe('replacing the project', () => {
  const choose = async (item: string) => {
    await app.page.click('button[aria-label="Project menu"]')
    await app.sleep(200)
    await app.clickMenuItem(item)
    await app.sleep(300)
  }
  const press = (label: string) =>
    app.page.evaluate((l) => ([...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent === l) as HTMLElement | undefined)?.click(), label)

  it('asks before a new project, and keeps the project when cancelled', async () => {
    const before = await app.nodeCount()
    await choose('New project')
    expect(await app.page.$('[role=dialog]')).not.toBeNull()
    await press('Cancel')
    await app.sleep(300)
    expect(await app.nodeCount()).toBe(before)

    await choose('New project')
    await press('Replace')
    await app.sleep(400)
    expect(await app.nodeCount()).toBe(1)
    // an empty project has nothing to lose: no question
    await choose('New project')
    expect(await app.page.$('[role=dialog]')).toBeNull()
  })

  it('can be undone after confirming', async () => {
    const before = await app.nodeCount()
    await choose('New project')
    await press('Replace')
    await app.sleep(400)
    await app.key('z', ['Control'])
    expect(await app.nodeCount()).toBe(before)
  })
})

describe('examples', () => {
  const openExamples = async () => {
    await app.page.click('button[aria-label="Project menu"]')
    await app.sleep(200)
    await app.clickMenuItem('Examples')
    await app.page.waitForSelector('[data-examples]')
  }

  it('shows each example with a live picture of its result', async () => {
    await openExamples()
    await app.sleep(600)
    const cards = await app.page.$$eval('[data-example]', (els) => els.map((e) => e.querySelector('canvas') !== null))
    expect(cards).toHaveLength(EXAMPLES.length)
    expect(cards.every(Boolean)).toBe(true)
    await app.key('Escape')
    await app.sleep(400)
    expect(await app.page.$('[data-examples]')).toBeNull()
  })

  it('keeps the cards whole on a phone: square picture, name and description', async () => {
    await app.page.setViewport({ width: 390, height: 760, isMobile: true, hasTouch: true })
    await app.reload()
    await openExamples()
    await app.sleep(500)
    const card = await app.page.$eval('[data-example]', (c) => {
      const picture = c.querySelector('canvas')!.getBoundingClientRect()
      const name = c.querySelector('.font-medium')!.getBoundingClientRect()
      return { ratio: picture.width / picture.height, nameHeight: name.height, nameBelow: name.top >= picture.bottom }
    })
    expect(card.ratio).toBeCloseTo(1, 1)
    expect(card.nameHeight).toBeGreaterThan(10)
    expect(card.nameBelow).toBe(true)
    await app.page.setViewport({ width: 1400, height: 800 })
  })

  it.each(EXAMPLES.map((e) => [e.name, e.id]))('"%s" loads and displays', async (_name, id) => {
    await openExamples()
    await app.page.$eval(`[data-example="${id}"]`, (card) => (card as HTMLElement).click())
    await app.sleep(500)
    await app.page.waitForSelector('[role=dialog]')
    await app.page.evaluate(() => ([...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent === 'Replace') as HTMLElement | undefined)?.click())
    await app.sleep(1200)
    expect(await app.page.evaluate(() => document.body.textContent)).not.toContain('Cannot display')
    expect(await app.nodeTitles()).toContain('Output')
  })
})

describe('node palette', () => {
  it('adds the best match for what is typed', async () => {
    const before = await app.nodeCount()
    await app.addNode('sin')
    expect(await app.nodeCount()).toBe(before + 1)
    expect((await app.nodeTitles()).filter((t) => t === 'Sin')).toHaveLength(1)
  })

  it('ranks an exact name before a longer one', async () => {
    await app.openPalette()
    await app.page.keyboard.type('sin')
    await app.sleep(250)
    const items = await app.paletteItems()
    expect(items[0]).toBe('Sin')
    expect(items).toContain('Cosine Palette')
  })

  it('lists recently added nodes first', async () => {
    await app.addNode('Smoothstep')
    await app.openPalette()
    expect((await app.paletteItems())[0]).toBe('Smoothstep')
  })

  it('shows what the highlighted node does', async () => {
    await app.openPalette()
    await app.page.keyboard.type('noise')
    await app.sleep(400)
    const aside = await app.page.evaluate(() => document.querySelector('aside')?.textContent ?? '')
    expect(aside).toContain('Noise')
    expect(aside).toContain('Position')
  })
})

describe('node palette, on a touch screen', () => {
  it('shows what a node does without adding it', async () => {
    await app.page.setViewport({ width: 390, height: 800, isMobile: true, hasTouch: true })
    await app.reload()
    const before = await app.nodeCount()
    await app.page.tap('button[aria-label^="Add a node"]')
    await app.page.waitForSelector('[data-palette]')
    await app.sleep(400)
    await app.page.$eval('[data-palette-info][aria-label="About Centered UV"]', (b) => (b as HTMLElement).click())
    await app.sleep(300)
    const text = await app.page.$eval('[data-palette]', (p) => p.textContent ?? '')
    expect(text).toContain('corrected for the aspect ratio so circles stay round') // the whole description
    expect(text).toContain('Add Centered UV')
    expect(await app.nodeCount()).toBe(before)
    await app.page.setViewport({ width: 1400, height: 800 })
  })
})

describe('node palette, on a phone', () => {
  const phone = async () => {
    await app.page.setViewport({ width: 390, height: 800, isMobile: true, hasTouch: true })
    await app.reload()
  }
  // long enough for the sheet to slide away
  const settle = () => app.sleep(500)
  const isOpen = () => app.page.evaluate(() => document.querySelector('[data-palette]') !== null)
  const openFromToolbar = async () => {
    await app.page.tap('button[aria-label^="Add a node"]')
    await app.page.waitForSelector('[data-palette]')
    await app.sleep(250)
  }
  afterEach(() => app.page.setViewport({ width: 1400, height: 800 }))

  it('closes with its button, and with the Back button without leaving the site', async () => {
    await phone()
    await openFromToolbar()
    // browsing first: the keyboard does not pop up over the list
    expect(await app.page.evaluate(() => document.activeElement?.tagName)).not.toBe('INPUT')
    await app.page.tap('[data-palette] button[aria-label="Close"]')
    await settle()
    expect(await isOpen()).toBe(false)

    await openFromToolbar()
    const url = app.page.url()
    await app.page.goBack()
    await settle()
    expect(await isOpen()).toBe(false)
    expect(app.page.url()).toBe(url)
    expect(await app.nodeCount()).toBeGreaterThan(1)
  })

  it('adds the tapped node', async () => {
    await phone()
    const before = await app.nodeCount()
    await openFromToolbar()
    await app.page.evaluate(() => {
      const item = [...document.querySelectorAll<HTMLElement>('[data-palette-item]')].find((i) => i.textContent?.startsWith('Polygon'))
      item?.click()
    })
    await settle()
    expect(await isOpen()).toBe(false)
    expect(await app.nodeCount()).toBe(before + 1)
    expect(await app.nodeTitles()).toContain('Polygon')
  })
})

describe('reloading with an overlay open', () => {
  it('does not reload the page again when the next overlay closes', async () => {
    await app.openPalette()
    await app.reload()
    await app.page.evaluate(() => ((window as unknown as { stillHere: boolean }).stillHere = true))
    await app.addNode('Sin')
    await app.sleep(600)
    // the same page is still running: nothing navigated away behind the user's back
    expect(await app.page.evaluate(() => (window as unknown as { stillHere?: boolean }).stillHere)).toBe(true)
    expect(await app.nodeTitles()).toContain('Sin')
  })
})

describe('keyboard', () => {
  it('copies, pastes and cuts the selection', async () => {
    const before = await app.nodeCount()
    await app.clickNode('Fract')
    await app.key('c', ['Control'])
    await app.key('v', ['Control'])
    await app.sleep(300)
    expect(await app.nodeCount()).toBe(before + 1)
    // the pasted copy is selected: cutting removes it, pasting brings it back
    await app.key('x', ['Control'])
    expect(await app.nodeCount()).toBe(before)
    await app.key('v', ['Control'])
    await app.sleep(300)
    expect(await app.nodeCount()).toBe(before + 1)
    expect((await app.nodeTitles()).filter((t) => t === 'Fract')).toHaveLength(2)
  })

  it('moves the highlight with the arrows and adds with Enter', async () => {
    await app.openPalette()
    await app.page.keyboard.type('co')
    await app.sleep(200)
    const items = await app.paletteItems()
    await app.key('ArrowDown')
    const highlighted = await app.page.$eval('[data-palette-item][aria-selected=true] .font-medium', (e) => e.textContent)
    expect(highlighted).toBe(items[1])
    await app.key('Enter')
    await app.sleep(300)
    expect(await app.nodeTitles()).toContain(items[1])
  })

  it('drops the selection with Escape', async () => {
    const selected = () => app.page.evaluate(() => document.querySelectorAll('.react-flow__node.selected').length)
    await app.clickNode('Fract')
    expect(await selected()).toBe(1)
    await app.key('Escape')
    expect(await selected()).toBe(0)
  })
})

describe('toolbar', () => {
  it('shows and hides the result', async () => {
    const shown = () => app.page.evaluate(() => document.querySelector('[data-result]') !== null)
    expect(await shown()).toBe(true)
    await app.page.click('button[aria-label="Result preview"]')
    await app.sleep(400) // it slides away first
    expect(await shown()).toBe(false)
    await app.page.click('button[aria-label="Result preview"]')
    await app.sleep(400)
    expect(await shown()).toBe(true)
  })

  it('resizes the result and shows it fullscreen', async () => {
    const width = () => app.page.$eval('[data-result]', (e) => e.getBoundingClientRect().width)
    const small = await width()
    await app.page.click('[data-result] button[aria-label="Larger"]')
    await app.sleep(400)
    expect(await width()).toBeGreaterThan(small * 1.4)
    await app.page.click('[data-result] button[aria-label="Fullscreen"]')
    await app.sleep(400)
    expect(await app.page.$('button[aria-label^="Close fullscreen"]')).not.toBeNull()
    await app.key('Escape')
    await app.sleep(400)
    expect(await app.page.$('button[aria-label^="Close fullscreen"]')).toBeNull()
  })
})

describe('selection bar', () => {
  const bar = () => app.page.$('[role=toolbar][aria-label="Selection"]')

  it('appears with the selection and acts on it', async () => {
    expect(await bar()).toBeNull()
    const before = await app.nodeCount()
    await app.clickNode('Fract')
    expect(await app.page.$eval('[role=toolbar][aria-label="Selection"]', (b) => b.textContent)).toContain('1 selected')
    await app.page.click('button[aria-label^="Duplicate selection"]')
    await app.sleep(250)
    expect(await app.nodeCount()).toBe(before + 1)
    await app.page.click('button[aria-label^="Delete selection"]')
    await app.sleep(450) // the bar slides away
    expect(await app.nodeCount()).toBe(before)
    expect(await bar()).toBeNull()
  })
})

describe('right-click menus', () => {
  it('duplicates a node', async () => {
    const before = await app.nodeCount()
    await app.rightClickNode('Split')
    expect(await app.menuItems()).toEqual(expect.arrayContaining([expect.stringContaining('Duplicate')]))
    await app.clickMenuItem('Duplicate')
    expect(await app.nodeCount()).toBe(before + 1)
  })

  it('deletes a wire', async () => {
    const before = await app.edgeCount()
    const at = await app.page.evaluate(() => {
      const path = document.querySelector<SVGPathElement>('.react-flow__edge-interaction')!
      const p = path.getPointAtLength(path.getTotalLength() * 0.5)
      const m = path.getScreenCTM()!
      return { x: p.x * m.a + m.e, y: p.y * m.d + m.f }
    })
    await app.page.mouse.click(at.x, at.y, { button: 'right' })
    await app.page.waitForSelector('[role=menu]')
    await app.clickMenuItem('Delete wire')
    expect(await app.edgeCount()).toBe(before - 1)
  })

  it('opens the palette from the canvas', async () => {
    // somewhere on the empty canvas, wherever the example leaves room
    const at = await app.page.evaluate(() => {
      for (let y = 780; y > 100; y -= 20)
        for (let x = 100; x < 1300; x += 20)
          if (document.elementFromPoint(x, y)?.classList.contains('react-flow__pane')) return { x, y }
      return null
    })
    await app.page.mouse.click(at!.x, at!.y, { button: 'right' })
    await app.page.waitForSelector('[role=menu]')
    expect(await app.menuItems()).toEqual(expect.arrayContaining([expect.stringContaining('Add a node here')]))
    await app.clickMenuItem('Add a node here')
    await app.page.waitForSelector('[data-palette]')
  })

  it('acts on a whole selection', async () => {
    const before = await app.nodeCount()
    await app.key('a', ['Control'])
    await app.rightClickNode('Fract')
    await app.clickMenuItem('Duplicate')
    // every node was duplicated, not just the one under the pointer
    expect(await app.nodeCount()).toBeGreaterThanOrEqual(before * 2 - 1)
  })
})

describe('editing', () => {
  it('undoes and redoes a typed number', async () => {
    const field = '[data-number-field]'
    const read = () => app.page.$eval(field, (e) => (e as HTMLInputElement).value)
    const original = await read()
    await app.page.click(field)
    await app.page.keyboard.type('7')
    await app.sleep(900)
    expect(await read()).toBe('7')
    await app.key('z', ['Control'])
    expect(await read()).toBe(original)
    await app.key('z', ['Control', 'Shift'])
    expect(await read()).toBe('7')
  })

  it('deletes the selection with the keyboard but never the Output node', async () => {
    await app.clickNode('Output')
    await app.key('Delete')
    expect(await app.nodeTitles()).toContain('Output')
    await app.clickNode('Fract')
    const before = await app.nodeCount()
    await app.key('Delete')
    expect(await app.nodeCount()).toBe(before - 1)
  })

  it('folds a node and hides its preview', async () => {
    const canvases = () => app.page.evaluate(() => document.querySelectorAll('.react-flow__node canvas').length)
    const before = await canvases()
    await app.rightClickNode('Split')
    await app.clickMenuItem('Hide preview')
    expect(await canvases()).toBeLessThan(before)
    await app.rightClickNode('Split')
    await app.clickMenuItem('Fold')
    await app.rightClickNode('Split')
    expect(await app.menuItems()).toEqual(expect.arrayContaining([expect.stringContaining('Unfold')]))
    await app.key('Escape')
  })
})

describe('view', () => {
  it('zooms with the buttons and fits the graph', async () => {
    const start = await zoomLevel()
    await app.page.click('button[aria-label="Zoom in"]')
    await app.sleep(400)
    const zoomedIn = await zoomLevel()
    expect(zoomedIn).toBeGreaterThan(start)
    await app.page.click('button[aria-label="Zoom out"]')
    await app.page.click('button[aria-label="Zoom out"]')
    await app.sleep(500)
    expect(await zoomLevel()).toBeLessThan(start)
    await app.page.click('button[aria-label^="Fit graph in view"]')
    await app.sleep(700)
    expect(await zoomLevel()).toBeGreaterThan(0.4)
  })

  it('switches between the move and select tools with V and H', async () => {
    const pressed = (label: string) =>
      app.page.$eval(`button[aria-label^="${label}"]`, (b) => b.getAttribute('aria-pressed'))
    expect(await pressed('Move the view')).toBe('true')
    await app.key('v')
    expect(await pressed('Select')).toBe('true')
    await app.key('h')
    expect(await pressed('Move the view')).toBe('true')
  })
})

describe('code panel', () => {
  it('shows the generated code and lights up the lines of the selected node', async () => {
    await app.page.click('button[aria-label="Generated code"]')
    await app.sleep(500)
    const code = () => app.page.evaluate(() => document.querySelector('pre')?.textContent ?? '')
    expect(await code()).toContain('void main()')

    // a node on the right: the panel covers the left of the canvas
    await app.clickNode('Fract')
    const lit = await app.page.evaluate(() => [...document.querySelectorAll('[data-lit]')].map((e) => e.textContent))
    expect(lit.length).toBeGreaterThan(0)

    await app.page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[role=tab]')].find((t) => t.textContent === 'WGSL')?.click())
    await app.sleep(300)
    expect(await code()).toContain('fn ')
  })
})

describe('touch screens', () => {
  afterEach(async () => {
    await app.page.setViewport({ width: 1400, height: 800 })
  })

  const position = (title: string) =>
    app.header(title).then((h) => h.boundingBox()).then((b) => ({ x: Math.round(b!.x), y: Math.round(b!.y) }))

  it('edits a value only once the node is selected', async () => {
    await app.page.setViewport({ width: 390, height: 800, isMobile: true, hasTouch: true })
    await app.reload()
    // the Multiply node in the default example has a number field for B
    const field = await app.page.evaluateHandle(() => {
      const node = [...document.querySelectorAll('.react-flow__node')].find(
        (n) => n.querySelector('.bg-node-header')?.textContent?.trim() === 'Multiply',
      )!
      return node.querySelector('[data-number-field]')
    })
    const el = field.asElement() as ElementHandle<Element>
    const box = (await el.boundingBox())!
    const focused = () => app.page.evaluate(() => document.activeElement?.hasAttribute('data-number-field') ?? false)
    const selectedCount = () => app.page.evaluate(() => document.querySelectorAll('.react-flow__node.selected').length)

    // first touch: selects the node, does not enter the field
    await app.page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
    await app.sleep(300)
    expect(await focused()).toBe(false)
    expect(await selectedCount()).toBe(1)

    // second touch: now the field reacts
    await app.page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
    await app.sleep(300)
    expect(await focused()).toBe(true)
  })

  it('moves a node only once it is selected', async () => {
    await app.page.setViewport({ width: 390, height: 800, isMobile: true, hasTouch: true })
    await app.reload()
    const box = (await (await app.header('Fract')).boundingBox())!
    const at = { x: box.x + 30, y: box.y + box.height / 2 }
    const drag = async () => {
      await app.page.touchscreen.touchStart(at.x, at.y)
      for (let i = 1; i <= 6; i++) await app.page.touchscreen.touchMove(at.x, at.y + i * 12)
      await app.page.touchscreen.touchEnd()
      await app.sleep(300)
    }

    // not selected: the drag moves the view, the node keeps its place on the graph
    const graphBefore = await app.page.evaluate(() => {
      const n = [...document.querySelectorAll('.react-flow__node')].find((n) => n.textContent?.includes('Fract'))!
      return n.getAttribute('style')
    })
    await drag()
    const graphAfter = await app.page.evaluate(() => {
      const n = [...document.querySelectorAll('.react-flow__node')].find((n) => n.textContent?.includes('Fract'))!
      return n.getAttribute('style')
    })
    expect(graphAfter).toBe(graphBefore)

    // tap to select, then the same drag moves the node
    await app.page.touchscreen.tap(at.x, at.y + 72)
    await app.sleep(300)
    const moving = await position('Fract')
    const box2 = (await (await app.header('Fract')).boundingBox())!
    const from = { x: box2.x + 30, y: box2.y + box2.height / 2 }
    await app.page.touchscreen.touchStart(from.x, from.y)
    for (let i = 1; i <= 6; i++) await app.page.touchscreen.touchMove(from.x, from.y + i * 12)
    await app.page.touchscreen.touchEnd()
    await app.sleep(300)
    expect(await position('Fract')).not.toEqual(moving)
  })
})
