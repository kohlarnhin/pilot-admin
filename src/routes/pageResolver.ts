import { matchRoutes } from 'react-router';

interface PagePattern {
  path: string;
  accessPath?: string;
  access?: string;
}

export const isParameterizedPage = (page: Pick<PagePattern, 'path'>): boolean => page.path.split('/').some((segment) => segment.startsWith(':') || segment === '*');

export function assertPageAccessPaths(pages: readonly PagePattern[]): void {
  for (const page of pages) {
    if (page.accessPath === undefined) continue;
    const owner = pages.find((candidate) => candidate.path === page.accessPath);
    if (!owner || owner.access !== 'menu' || isParameterizedPage(owner)) {
      throw new Error(`Invalid accessPath "${page.accessPath}" for "${page.path}": expected a registered static menu page`);
    }
  }
}

/** 与 Router 共用注册顺序和 matchRoutes 排名；不自行解码或转换参数大小写。 */
export function createPageResolver<T extends PagePattern>(pages: readonly T[]) {
  const routes = pages.map((page) => ({ path: page.path, handle: page }));
  return (pathname: string) => {
    if (!pathname.startsWith('/') || pathname.startsWith('//')) return undefined;
    const matches = matchRoutes(routes, pathname.split(/[?#]/, 1)[0]);
    const match = matches?.at(-1);
    return match ? { page: match.route.handle, params: match.params, pathname: match.pathname } : undefined;
  };
}
