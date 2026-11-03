import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/** 只预载登录页实际使用的西文字体，文件名由构建产物解析，兼容部署前缀。 */
function loginFontPreloads(base: string): Plugin {
  return {
    name: 'login-font-preloads',
    transformIndexHtml: {
      order: 'post',
      handler(_html, { bundle }) {
        if (!bundle) return;
        const fonts = [/\/open-sans-latin-wght-normal-[^/]+\.woff2$/, /\/jetbrains-mono-latin-400-normal-[^/]+\.woff2$/];
        return fonts.map((pattern) => {
          const font = Object.values(bundle).find((asset) => asset.type === 'asset' && pattern.test(asset.fileName));
          if (!font) throw new Error(`Missing login font: ${pattern}`);
          return { tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: `${base}${font.fileName}` }, injectTo: 'head' };
        });
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const basePath = env.VITE_BASE_PATH?.trim() || '/';
  const baseSegments = basePath.split('/').filter(Boolean);
  if (/^[a-z][a-z\d+.-]*:|^\/\/|:\/\/|[\\?#\s]/i.test(basePath)
    || baseSegments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error('VITE_BASE_PATH must be a pathname such as /pilot-admin/, without a scheme, host, query, fragment, whitespace, backslash or dot segments.');
  }
  const base = baseSegments.length ? `/${baseSegments.join('/')}/` : '/';
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim();
  const apiBasePath = new URL(env.VITE_API_BASE_URL || '/api', 'http://localhost').pathname.replace(/\/+$/, '') || '/';

  return {
    base,
    plugins: [react(), loginFontPreloads(base)],
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
          // 保留动态导入边界；自动合并小分包会把认证后的页面与加载态提升到入口。
          manualChunks(id) {
            // 包内子路径与 CommonJS 代理一起归组，避免 jsx-runtime 落入 UI 分包形成环。
            const module = id.replaceAll('\\', '/');
            if (module.includes('commonjsHelpers') || /\/node_modules\/(react|react-dom|react-router|scheduler)\//.test(module)) return 'vendor-react';
            if (/\/node_modules\/@tanstack\/(react-virtual|virtual-core)\//.test(module)) return 'vendor-virtual';
            if (/\/node_modules\/(@radix-ui|@floating-ui)\//.test(module)) return 'vendor-ui';
            if (/\/node_modules\/(dayjs|zustand|sonner|lucide-react|clsx|tailwind-merge)\//.test(module)) return 'vendor-utils';
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
