import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: { format: 'iife', name: 'KhanaApp' },
    },
  },
});
