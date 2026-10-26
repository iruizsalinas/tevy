import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { devPages } from './site/dev.js';

// One client entry per page type; each hydrates its prerendered page.
const entries = {
  catalog: 'site/src/client/catalog.ts',
  license: 'site/src/client/license.ts',
  model: 'site/src/client/model.ts',
  missing: 'site/src/client/missing.ts',
};

export default defineConfig(({ isSsrBuild }) => ({
  publicDir: 'site/public',
  appType: 'custom',
  plugins: [svelte(), devPages()],
  // KTX2Loader finds its transcoder relative to its own module, which pre-bundling would break.
  optimizeDeps: { exclude: ['three'] },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    manifest: !isSsrBuild,
    // three.js alone is about 700 kB minified; it is loaded lazily by the viewer only.
    chunkSizeWarningLimit: 900,
    rolldownOptions: isSsrBuild ? {} : { input: entries },
  },
}));
