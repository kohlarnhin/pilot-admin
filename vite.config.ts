import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-dropdown-menu',
            '@tanstack/react-virtual',
          ],
          'vendor-utils': ['dayjs', 'zustand', 'sonner', 'lucide-react', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
  server: { host: '0.0.0.0', port: 3300, strictPort: true, open: false },
});
