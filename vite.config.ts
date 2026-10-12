/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { serviceWorkerPlugin } from './scripts/sw-plugin.ts';

// A relative base makes the build work at a domain root (Vercel, Netlify)
// and inside a repository sub-path (GitHub Pages) without extra config.
// Override with BASE_PATH=/my-repo/ if you ever need an absolute base.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [react(), tailwindcss(), serviceWorkerPlugin()],
  build: {
    target: 'es2022',
    cssMinify: true,
    sourcemap: false,
    modulePreload: { polyfill: false },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
    restoreMocks: true,
  },
});
