import { afterEach, beforeEach, vi } from 'vitest';

class MemoryStorage implements Storage {
  #items = new Map<string, string>();

  get length(): number { return this.#items.size; }

  clear(): void {
    for (const key of this.#items.keys()) this.removeItem(key);
  }

  getItem(key: string): string | null {
    return this.#items.get(String(key)) ?? null;
  }

  key(index: number): string | null {
    return [...this.#items.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.#items.delete(String(key));
    if (Object.prototype.hasOwnProperty.call(this, key)) Reflect.deleteProperty(this, key);
  }

  setItem(key: string, value: string): void {
    const name = String(key);
    this.#items.set(name, String(value));
    // Mock DB 按 Object.keys(Storage) 清理版本键；方法仍保留在原型上。
    if (!(name in MemoryStorage.prototype)) {
      Object.defineProperty(this, name, { configurable: true, enumerable: true, get: () => this.getItem(name) });
    }
  }
}

function installBrowserStubs(): void {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const documentStub = { documentElement: { lang: '' } };
  const windowStub = Object.assign(new EventTarget(), {
    document: documentStub,
    localStorage: local,
    sessionStorage: session,
    location: Object.assign(new URL('http://localhost:3300/'), {
      reload: vi.fn(),
      assign: vi.fn(),
      replace: vi.fn(),
    }),
    setTimeout: (...args: Parameters<typeof setTimeout>) => globalThis.setTimeout(...args),
    clearTimeout: (...args: Parameters<typeof clearTimeout>) => globalThis.clearTimeout(...args),
  });
  vi.stubGlobal('Storage', MemoryStorage);
  vi.stubGlobal('localStorage', local);
  vi.stubGlobal('sessionStorage', session);
  vi.stubGlobal('document', documentStub);
  vi.stubGlobal('window', windowStub);
}

// setupFiles 先于测试模块执行，静态导入也能访问最小浏览器边界。
installBrowserStubs();

beforeEach(() => {
  // 新 EventTarget 隔离 resetModules 后重新注册的 storage listeners。
  installBrowserStubs();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
