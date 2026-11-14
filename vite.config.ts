/// <reference types="vitest" />
import { defineConfig } from 'vite';

// GitHub Pages serves the site from /<repo-name>/
const REPO = process.env.REPO_NAME ?? 'roda-orbital';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${REPO}/` : '/',
  build: { target: 'es2022', sourcemap: true, chunkSizeWarningLimit: 1500 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
