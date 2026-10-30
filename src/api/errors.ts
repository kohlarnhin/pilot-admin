export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.status === 401 || error.code === 1002);
}

let unauthorizedHandler: (() => void) | null = null;

/** 由认证状态层接管 Token 最终失效后的本地用户状态清理。 */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized(): void {
  unauthorizedHandler?.();
}
