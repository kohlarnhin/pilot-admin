import { API_BASE_URL, ApiRequestError, refreshAccessToken } from './http';
import { syncStoredTokens } from './tokenStorage';
import type { AgentChatProgress } from '@/types';

export interface SseCallbacks<T> {
  onStart?: (sessionId: string | number, userMessageId: string | number) => void;
  onDelta?: (delta: string) => void;
  onProgress?: (progress: AgentChatProgress) => void;
  onResult?: (result: T) => void;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/** 真实后端接入点；默认 Mock 引擎不经过 HTTP。事件以空行分隔，结果使用 ApiResponse<T>。 */
export async function runSseStream<T>(url: string, payload: Record<string, unknown>, callbacks: SseCallbacks<T> = {}): Promise<T> {
  const { onStart, onDelta, onProgress, onResult, signal, timeoutMs = 180_000 } = callbacks;
  const timeout = new AbortController();
  const timeoutId = setTimeout(() => timeout.abort(), timeoutMs);
  const mergedSignal = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' };
  let accessToken = syncStoredTokens()?.accessToken;
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const cancel = () => { void reader?.cancel().catch(() => {}); };
  try {
    mergedSignal.throwIfAborted();
    // 根路径和完整 URL 按调用方原样使用；无前导斜杠的路径相对 API base。
    const requestUrl = url.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(url)
      ? url
      : `${API_BASE_URL.replace(/\/+$/, '')}/${url.replace(/^\.\//, '')}`;
    const request = () => fetch(requestUrl, { method: 'POST', headers, body: JSON.stringify(payload), signal: mergedSignal });
    let response = await request();
    if (response.status === 401 && accessToken) {
      accessToken = await refreshAccessToken(accessToken);
      headers.Authorization = `Bearer ${accessToken}`;
      response = await request();
    }
    if (!response.ok) {
      let message = '请求失败，请稍后重试';
      let code: number | undefined;
      try {
        const body = await response.json();
        if (typeof body.message === 'string') message = body.message;
        if (typeof body.code === 'number') code = body.code;
      } catch { /* 非 JSON 错误使用默认提示。 */ }
      throw new ApiRequestError(message, response.status, code);
    }
    if (!response.body) throw new ApiRequestError('无法建立流式响应通道');
    reader = response.body.getReader();
    mergedSignal.addEventListener('abort', cancel, { once: true });
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalResult: T | undefined;
    let completed = false;
    const processEventBlock = (block: string) => {
      let eventName = 'message';
      const dataLines: string[] = [];
      for (const line of block.split(/\r?\n/)) {
        if (!line || line.startsWith(':')) continue;
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''));
      }
      if (!dataLines.length) return;
      const raw = dataLines.join('\n');
      if (eventName === 'start') {
        const value = JSON.parse(raw) as { sessionId: string | number; userMessageId: string | number };
        onStart?.(value.sessionId, value.userMessageId);
      } else if (eventName === 'delta') {
        let content: string;
        try {
          const value = JSON.parse(raw) as { content?: string };
          content = value.content || '';
        } catch { content = raw; }
        if (content) onDelta?.(content);
      } else if (eventName === 'progress') {
        try {
          const value = JSON.parse(raw) as Partial<AgentChatProgress>;
          if (typeof value.message === 'string' && value.message.trim()) onProgress?.({
            stage: typeof value.stage === 'string' ? value.stage : 'processing',
            message: value.message,
            elapsedSeconds: Math.max(0, value.elapsedSeconds || 0),
            messageId: value.messageId,
            sequenceNo: value.sequenceNo,
            createDate: value.createDate,
          });
        } catch { /* 无效进度不影响最终结果。 */ }
      } else if (eventName === 'result' || eventName === 'done') {
        const value = JSON.parse(raw) as { code: number; message?: string; data: T };
        if (value.code !== 0) throw new ApiRequestError(value.message || '处理失败', 200, value.code);
        if (value.data === undefined || value.data === null) throw new ApiRequestError('结果响应不完整');
        finalResult = value.data;
        completed = true;
      } else if (eventName === 'error') {
        let message = raw;
        let code: number | undefined;
        try {
          const value = JSON.parse(raw) as { message?: string; code?: number };
          message = value.message || 'AI 助手处理异常';
          code = value.code;
        } catch { /* 兼容纯文本错误。 */ }
        throw new ApiRequestError(message, 200, code);
      }
    };
    while (!completed) {
      mergedSignal.throwIfAborted();
      const { done, value } = await reader.read();
      mergedSignal.throwIfAborted();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || '';
      for (const block of parts) {
        mergedSignal.throwIfAborted();
        if (block.trim()) processEventBlock(block);
        if (completed) break;
      }
      if (done) {
        if (!completed && buffer.trim()) processEventBlock(buffer);
        break;
      }
    }
    mergedSignal.throwIfAborted();
    if (!completed) throw new ApiRequestError('流式响应中断，请重试');
    onResult?.(finalResult!);
    return finalResult!;
  } catch (error) {
    if (signal?.aborted) throw signal.reason || new DOMException('已取消', 'AbortError');
    if (timeout.signal.aborted) throw new ApiRequestError('AI 助手响应超时，请重试');
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(error instanceof SyntaxError ? '流式响应格式无效' : '网络连接异常，无法连接到 AI 助手');
  } finally {
    mergedSignal.removeEventListener('abort', cancel);
    if (reader) {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    clearTimeout(timeoutId);
  }
}
