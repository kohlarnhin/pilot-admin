let pendingResourceLoads = 0;

export const hasPendingResourceLoads = () => pendingResourceLoads > 0;

/** 预取与正式打开共用 Promise；失败释放缓存，交给原界面显式重试。 */
export function createLazyResource<T>(load: () => Promise<T>) {
  let value: T | undefined;
  let promise: Promise<T> | undefined;
  return {
    peek: () => value,
    load: () => {
      if (!promise) {
        pendingResourceLoads += 1;
        promise = Promise.resolve().then(load).then((module) => {
          value = module;
          return module;
        }).catch((error: unknown) => {
          promise = undefined;
          throw error;
        }).finally(() => { pendingResourceLoads -= 1; });
      }
      return promise;
    },
  };
}
