import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim();
  const apiBasePath = new URL(env.VITE_API_BASE_URL || '/api', 'http://localhost').pathname.replace(/\/+$/, '') || '/';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      assetsInlineLimit: (filePath) => /\.woff2?$/i.test(filePath) ? false : undefined,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          experimentalMinChunkSize: 5_000,
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
    server: {
      host: '0.0.0.0',
      port: 3300,
      strictPort: true,
      open: false,
      ...(proxyTarget ? {
        proxy: {
          [apiBasePath]: { target: proxyTarget, changeOrigin: true, ws: false },
        },
      } : {}),
    },
    // Vite 默认会让 preview 继承 server.proxy；这里明确只在开发时代理。
    preview: { proxy: {} },
  };
});
