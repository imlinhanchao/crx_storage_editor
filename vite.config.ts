import { crx, ManifestV3Export } from '@crxjs/vite-plugin'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        panel: 'src/panel/index.html',
        devtools: 'src/devtools/index.html',
      },
    },
  },
  plugins: [vue(), crx({ manifest: manifest as ManifestV3Export }),]
})
