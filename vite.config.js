import { defineConfig } from 'vite';
// GitHub Pages serves a project site from /<repo>/; the deploy workflow passes the repo name in.
const base = process.env.VITE_BASE ?? '/';
export default defineConfig({ base, build: { target: 'es2020', sourcemap: true } });
