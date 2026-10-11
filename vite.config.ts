import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs: the build works from any path (GitHub Pages project sites,
  // custom domains, a plain folder), whatever the repository is called.
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Rarely-changing dependencies get their own files, so a code change
        // does not make returning visitors download React again.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(@xyflow|d3-[^/]+|zustand|zundo)\//.test(id)) return 'editor'
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          return undefined
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
