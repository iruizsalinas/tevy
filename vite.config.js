import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit({
      // Fully static output for Cloudflare Workers static assets.
      adapter: adapter({ pages: 'dist', assets: 'dist', strict: true }),
      files: { src: 'site/src', assets: 'site/public' },
      // Built site files (scripts, styles, fonts, the KTX2 transcoder) go under /assets/.
      appDir: 'assets',
      // Root-relative asset URLs: 404.html is served at whatever path was missing.
      paths: { origin: 'https://tevy.dev', relative: false },
      prerender: { handleHttpError: 'fail' },
    }),
  ],
  // KTX2Loader finds its transcoder relative to its own module, which pre-bundling would break.
  optimizeDeps: { exclude: ['three'] },
  build: {
    // three.js alone is about 700 kB minified; it is loaded lazily by the viewer only.
    chunkSizeWarningLimit: 900,
  },
});
