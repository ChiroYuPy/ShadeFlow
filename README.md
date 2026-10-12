# ShadeFlow

A node-based shader editor that runs in your browser. Connect nodes to build a shader, see
every intermediate result live, and read the code it generates — to learn how shaders work.

## 👉 [**Open ShadeFlow — chiroyupy.github.io/ShadeFlow**](https://chiroyupy.github.io/ShadeFlow/)

Nothing to install, no account: that link is the app itself.

- **Node graph** with a live preview on any node and a description for each one
- **Generated code** in GLSL, WGSL and HLSL
- **Examples** with explanatory notes
- **Everything stays local**: projects autosave in your browser and export as JSON

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

## Deployment

Pushing to `main` builds, tests and publishes the site with GitHub Pages
(`.github/workflows/deploy.yml`). One-time setup: in the repository settings, set
**Pages → Source** to **GitHub Actions**.
