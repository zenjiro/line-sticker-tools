import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/line-sticker-tools/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        removeBg: resolve(__dirname, 'remove-bg/index.html'),
        divideCrop: resolve(__dirname, 'divide-crop/index.html'),
        arrange: resolve(__dirname, 'arrange/index.html'),
      },
    },
  },
})
