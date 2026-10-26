import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { basisTranscoder } from './site/vite-plugins.js';

export default defineConfig({
  plugins: [
    basisTranscoder(),
    sveltekit({
      // Fully static output for Cloudflare Workers static assets.
      adapter: adapter({ pages: 'dist', assets: 'dist', strict: true }),
      files: { src: 'site/src', assets: 'site/public' },
      // Root-relative asset URLs: 404.html is served at whatever path was missing.
      paths: { origin: 'https://tevy.dev', relative: false },
      prerender: { handleHttpError: 'fail' },
    }),
  ],
  build: {
    // three.js alone is about 700 kB minified; it is loaded lazily by the viewer only.
    chunkSizeWarningLimit: 900,
  },
});
