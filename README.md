# ShadeFlow

A node-based shader editor for the web. Build a shader by connecting nodes, see every
intermediate result live, and read the code it generates — to learn how shaders work.

- **Node graph** where any node can show its live result (eye icon), with a description for each one,
  and a node library that previews what a node does before you add it
- **Generated code** in GLSL, WGSL and HLSL, from one language-independent IR
- **Examples** with explanatory notes (gradients, rings, checkerboard, clouds, rainbow…)
- **Comfortable editing**: undo/redo, copy/paste/duplicate, drag numbers to change them,
  drop a wire on empty space to add a node that fits, notes for your own explanations
- **Runs 100% in the browser**: projects are autosaved locally and can be exported as JSON
- Press **?** in the app for the list of gestures and shortcuts

## Development

```bash
npm install
npm run dev      # dev server
npm test         # unit tests (compiler, store, project files)
npm run test:e2e # browser tests (needs Chrome or Chromium)
npm run lint
npm run build    # production build in dist/
```

## Architecture

```
Graph (UI, React Flow) → graph model → IR (typed) → code generator → GLSL | WGSL | HLSL
```

| Folder | Role |
|---|---|
| `src/core` | Pure TypeScript, no React: graph model, node definitions, IR, compiler, code generators |
| `src/render` | WebGL2 renderer and the shared preview hub |
| `src/store` | Zustand stores: project graph (with undo/redo) and editor UI state |
| `src/editor` | React Flow canvas, nodes, value editors |
| `src/ui` | Toolbar, node palette, code panel, preview |
| `src/index.css` | The theme: the single place where colors are defined |

Only GLSL is executed (WebGL2). WGSL and HLSL are generated for reading and export.

See `CLAUDE.md` for the invariants of the codebase and how to add nodes, ops and languages.

## Deployment

Pushing to `main` builds, tests and publishes the site with GitHub Pages
(`.github/workflows/deploy.yml`). One-time setup: in the repository settings, set
**Pages → Source** to **GitHub Actions**.
