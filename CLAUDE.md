# ShadeFlow

A node-based shader editor for the web, made to make shader creation accessible and to help people
**learn and understand** how shaders work (visible generated code, per-node previews, node
descriptions, notes). 100% client-side, English-only UI, dark theme only, deployed to GitHub Pages.

Ignore the `.SF/` folder: it is an unrelated earlier attempt, not part of this project.

## Commands

```bash
npm run dev      # Vite dev server
npm test         # Vitest (compiler, code generators, node catalogue, store, project files, examples)
npm run lint     # ESLint (type-aware, react-hooks v7 rules)
npm run build    # tsc -b && vite build
npm run check    # typecheck + lint + tests + build, in one go
npm run test:e2e # browser tests (needs Chrome/Chromium; set CHROME_PATH if not found), ~90 s
```

Always finish a change with `npm run check`; run `npm run test:e2e` after changing the editor UI.
`e2e/` drives the real app in Chrome (puppeteer-core + a Vite dev server started by the tests).

## Architecture

```
Graph (React Flow UI) → graph model → typed IR → code generator → GLSL | WGSL | HLSL
```

- **`src/core`** — pure TypeScript, **no React, no DOM**. This is the product's heart; keep it that way.
  - `graph.ts` serializable model (`Graph`, `GraphNode`, `GraphEdge`), `sameShader`.
  - `nodes/` declarative node definitions (`builtin.ts`) + registry. One entry per node.
  - `ir/` flat SSA-like typed IR. `IRBuilder` does hash-consing and dead-code elimination.
  - `compile/lower.ts` graph → IR, with error recovery (several diagnostics at once).
  - `codegen/` `emit.ts` is shared; `glsl.ts`, `wgsl.ts`, `hlsl.ts` are just `Target` tables.
  - `typing.ts` generic-type resolution, `canConnect`, `compatiblePort`.
  - `project.ts` file format + sanitizing, `clipboard.ts` copy/paste fragments.
  - `codegen/emit.ts` also returns, for each generated line, the node it came from (`IRInstr.origin`):
    the code panel uses it to link lines and nodes (`generateCodeLines`).
  - `evaluate.ts` tiny CPU interpreter of the IR (tests, and node previews that show a number).
- **`src/render`** — WebGL2. `ShaderRenderer` (main preview) and `previewHub` (all node previews).
  A node preview is an **image** (value varies across the screen: drawn on one shared offscreen
  GL context, programs cached by GLSL source) or a **value** (same everywhere, e.g. Time or
  `Time × 0.3`: computed on the CPU with `evaluate` and shown as a number). The kind is decided
  from the IR (`previewValue.ts`: does it read `uv`?). Constants opt out with `preview: 'none'`.
  Previews are **per node and hidden by default** (like Blender): `GraphNode.showPreview`, toggled by
  the eye in the node header; the toolbar eye is the master switch. Only mounted previews cost anything.
- **`src/store`** — Zustand. `graphStore` (graph + undo/redo via zundo, autosave to localStorage),
  `uiStore` (selection, palette, panels; not undoable), `fileActions` (project/clipboard actions).
- **`src/editor`** — React Flow canvas, node components, value editors. The graph store is the
  single source of truth; React Flow nodes are derived each render. Every port is **one row**
  with its label; an unwired input also shows its value editor on that row (number field, `x y z`
  fields, color swatch), a wired one shows just the label. The header has a per-node icon (`nodeLook.ts`) tinted by category,
  the preview eye and, on the right, the fold arrow (`GraphNode.collapsed`).
- **`src/ui`** — toolbar (the same on every device: menu + history top left, add / tool / view toggles
  bottom center with duplicate / delete once something is selected, zoom column bottom right;
  `uiStore.tool` is `pan` or `select`), palette, code panel, preview, help. Palette/code/help are lazy-loaded. Right-click opens
  `ContextMenu` (node / wire / canvas). The palette
  shows, for the highlighted node, a live preview (`previewHub.sandboxId`: a one-node graph fed with UV),
  its description and its ports.
- **`src/demo/examples.ts`** — built-in examples written with a compact `graphOf` notation.
- **`src/index.css`** — the Tailwind v4 `@theme`: **the single place where colors live**,
  including port colors (`--port-float`, `--port-vec3`…) and the single selection/active/focus
  accent (`--selection`, violet).

## Invariants worth knowing

- **IR**: componentwise ops always have arguments of the same type; broadcasting (`1 → (1,1,1)`)
  is an explicit `construct` inserted by the compiler. Only float → vecN is implicit, never narrowing.
- **Generic ports** (`gen`) of a node share one type: the vector type of whatever is wired (float if none).
- **Output node**: exactly one, undeletable, takes a `vec3`; alpha is always 1.
- **Previews/code never depend on node positions**: `sameShader` ignores positions, note text and
  `previewPort`, so dragging never recompiles anything.
- **Undo grouping**: continuous gestures (drag, typing in a field, color picking) are ONE undo step
  (`beginGesture` / `endGesture`, `editValue` / `editText`). Use these, not raw `setValue`, from UI.
- **`mod`** is a floored mod everywhere (WGSL/HLSL spell it out; their `%`/`fmod` truncate).
- **Time** is `performance.now()/1000` in every renderer, so previews stay in sync.

## How to extend

- **Add a node**: add a `NodeDef` to `core/nodes/builtin.ts`. Prefer composing existing IR ops in
  `lower` (the generated code then teaches how it works). Give it a real `description`. The
  catalogue test automatically checks that it compiles to all three languages.
- **Add an IR op**: `ir/ops.ts` (name + signature), then a syntax entry in each of the three
  `codegen/*.ts` tables (TypeScript enforces exhaustiveness), then an `evaluate.ts` entry if testable.
- **Add a language**: a new `Target` in `codegen/` + `SHADER_LANGUAGES` + a tab (the UI is data-driven).
- **Add an example**: `src/demo/examples.ts`. `examples.test.ts` checks it compiles, has valid wires,
  has notes and survives save/open.

## Conventions and gotchas

- TypeScript is strict with `erasableSyntaxOnly`: no enums, no constructor parameter properties.
- ESLint enforces react-hooks v7: no ref writes during render, no conditional hooks. Files exporting
  components must export only components (helpers go in separate modules).
- **shadcn CLI**: generated `command.tsx`/others may import `cn` from the npm package `cn`; this
  project's `cn` is `@/lib/utils` (clsx + tailwind-merge). Fix imports after `shadcn add`, and keep
  `CommandDialog` wrapping its children in `<Command>`.
- Do not add dependencies lightly: React, React Flow, Zustand, zundo, Tailwind and shadcn/Radix
  cover the needs. WGSL is validated against a real WebGPU compiler in dev, HLSL only by text tests.
- Out of scope so far (deliberately): textures, vertex shader / 3D, custom nodes, translations.
