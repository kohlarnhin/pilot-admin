import { t } from '@/i18n';
// Open Sans Variable（西文/数字）+ Noto Sans SC（中文，轻量现代）
import '@fontsource-variable/open-sans';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { version } from '../package.json';
import './index.css';
import { reloadOnceForChunkError } from './utils/chunkReload';
import { hasPendingResourceLoads } from './utils/lazyResource';
import { hasPendingRouteLoads } from './routes/routeModules';

window.addEventListener('vite:preloadError', (event) => {
  console.error(t('client.resourceError'), (event as Event & { payload: unknown }).payload);
  // 防止 Vite 吞掉路由分包的原始异常；路由错误页负责刷新，悬停预取则保持静默。
  if (hasPendingRouteLoads() || hasPendingResourceLoads()) return;
  // 其他资源只有在刷新已安排时才阻止默认抛错。
  if (reloadOnceForChunkError()) event.preventDefault();
});

// 每次页面加载或刷新时输出当前前端版本。
console.info(t('client.version', { version }));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
