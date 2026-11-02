import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn<typeof fetch>();
let sse: typeof import('@/api/sse');
let http: typeof import('@/api/http');

function streamResponse(text: string, chunkSize = 64): Response {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        controller.enqueue(bytes.slice(offset, offset + chunkSize));
      }
      controller.close();
    },
  }), { headers: { 'Content-Type': 'text/event-stream' } });
}

beforeEach(async () => {
  localStorage.setItem('pilot-admin:auth:tokens:v2', JSON.stringify({ accessToken: 'old-access', refreshToken: 'refresh' }));
  vi.resetModules();
  http = await import('@/api/http');
  // 只替换刷新接缝；SSE 解析、令牌存储和错误类型仍来自真实模块。
  vi.spyOn(http, 'refreshAccessToken').mockRejectedValue(new Error('Unexpected token refresh'));
  sse = await import('@/api/sse');
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('runSseStream', () => {
  it('frames split events and UTF-8 bytes, dispatching start/delta/progress/result in order', async () => {
    const events: unknown[] = [];
    fetchMock.mockResolvedValue(streamResponse([
      ': heartbeat\r\n\r\n',
      'event: start\r\ndata: {"sessionId":"session-1","userMessageId":7}\r\n\r\n',
      'event: delta\r\ndata: {"content":"你好 👋"}\r\n\r\n',
      'event: progress\r\ndata: {"stage":"checking","message":"正在处理","elapsedSeconds":2,"sequenceNo":9}\r\n\r\n',
      'event: result\r\ndata: {"code":0,"data":{"message":"完成"}}\r\n\r\n',
    ].join(''), 1));

    const result = await sse.runSseStream('agent/chat', { prompt: 'hello' }, {
      onStart: (session, message) => events.push(['start', session, message]),
      onDelta: (delta) => events.push(['delta', delta]),
      onProgress: (progress) => events.push(['progress', progress]),
      onResult: (value) => events.push(['result', value]),
    });

    expect(result).toEqual({ message: '完成' });
    expect(events).toEqual([
      ['start', 'session-1', 7],
      ['delta', '你好 👋'],
      ['progress', expect.objectContaining({ stage: 'checking', message: '正在处理', elapsedSeconds: 2, sequenceNo: 9 })],
      ['result', { message: '完成' }],
    ]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${http.API_BASE_URL.replace(/\/+$/, '')}/agent/chat`, expect.objectContaining({
      method: 'POST',
      body: '{"prompt":"hello"}',
      headers: expect.objectContaining({ 'Accept-Language': 'zh-CN', Authorization: 'Bearer old-access' }),
    }));
  });

  it('joins multi-line data and accepts a final done event without a trailing blank line', async () => {
    const onDelta = vi.fn();
    fetchMock.mockResolvedValue(streamResponse([
      'event: delta\ndata: line one\ndata: line two\n\n',
      'event: done\ndata: {"code": 0,\ndata: "data": {"ok": true}}',
    ].join(''), 3));
    await expect(sse.runSseStream('/stream', {}, { onDelta })).resolves.toEqual({ ok: true });
    expect(onDelta).toHaveBeenCalledExactlyOnceWith('line one\nline two');
  });

  it('ignores invalid progress and normalizes optional progress fields', async () => {
    const onProgress = vi.fn();
    fetchMock.mockResolvedValue(streamResponse([
      'event: progress\ndata: not json\n\n',
      'event: progress\ndata: {"message":"   "}\n\n',
      'event: progress\ndata: {"message":"working","elapsedSeconds":-3}\n\n',
      'event: result\ndata: {"code":0,"data":false}\n\n',
    ].join('')));
    await expect(sse.runSseStream('/stream', {}, { onProgress })).resolves.toBe(false);
    expect(onProgress).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ stage: 'processing', message: 'working', elapsedSeconds: 0 }));
  });

  it.each([
    ['{"code":4201,"message":"Denied"}', { name: 'ApiRequestError', status: 200, code: 4201, message: 'Denied' }],
    ['Upstream failed', { name: 'ApiRequestError', status: 200, message: 'Upstream failed' }],
  ])('rejects error events with their code and message: %s', async (data, error) => {
    fetchMock.mockResolvedValue(streamResponse(`event: error\ndata: ${data}\n\n`));
    await expect(sse.runSseStream('/stream', {})).rejects.toMatchObject(error);
  });

  it('rejects a stream ending without a result and never emits onResult', async () => {
    const { t } = await import('@/i18n');
    const onResult = vi.fn();
    fetchMock.mockResolvedValue(streamResponse('event: delta\ndata: {"content":"partial"}\n\n'));
    await expect(sse.runSseStream('/stream', {}, { onResult })).rejects.toMatchObject({
      name: 'ApiRequestError', message: t('client.streamInterrupted'),
    });
    expect(onResult).not.toHaveBeenCalled();
  });

  it.each([
    ['{"code":4100,"message":"Rejected","data":{}}', 'Rejected'],
    ['{"code":0,"data":null}', 'incomplete'],
    ['{broken json', 'invalid'],
  ])('rejects an unsuccessful, incomplete or malformed result: %s', async (data, message) => {
    const { t } = await import('@/i18n');
    fetchMock.mockResolvedValue(streamResponse(`event: result\ndata: ${data}\n\n`));
    await expect(sse.runSseStream('/stream', {})).rejects.toMatchObject({
      name: 'ApiRequestError',
      message: message === 'incomplete' ? t('client.resultIncomplete') : message === 'invalid' ? t('client.invalidStream') : message,
    });
  });

  it('cancels a pending reader on abort and propagates the caller reason', async () => {
    const controller = new AbortController();
    const onResult = vi.fn();
    const cancel = vi.fn();
    let markReading!: () => void;
    const reading = new Promise<void>((resolve) => { markReading = resolve; });
    const body = new ReadableStream<Uint8Array>({
      pull() { markReading(); },
      cancel,
    }, { highWaterMark: 0 });
    fetchMock.mockResolvedValue(new Response(body));
    const pending = sse.runSseStream('/stream', {}, { signal: controller.signal, onResult });
    const reason = new DOMException('Stopped by test', 'AbortError');
    const rejected = expect(pending).rejects.toBe(reason);
    await reading;
    controller.abort(reason);
    await rejected;
    expect(cancel).toHaveBeenCalledOnce();
    expect(body.locked).toBe(false);
    expect(onResult).not.toHaveBeenCalled();
  });

  it('does not fetch if already aborted', async () => {
    const reason = new DOMException('Already stopped', 'AbortError');
    await expect(sse.runSseStream('/stream', {}, { signal: AbortSignal.abort(reason) })).rejects.toBe(reason);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes once on 401 and retries with the new Authorization header', async () => {
    vi.mocked(http.refreshAccessToken).mockResolvedValue('new-access');
    const authorizations: (string | undefined)[] = [];
    fetchMock.mockImplementation(async (_url, init) => {
      authorizations.push((init?.headers as Record<string, string>).Authorization);
      return authorizations.length === 1
        ? new Response('', { status: 401 })
        : streamResponse('event: result\ndata: {"code":0,"data":{"ok":true}}\n\n');
    });
    await expect(sse.runSseStream('/stream', {})).resolves.toEqual({ ok: true });
    expect(http.refreshAccessToken).toHaveBeenCalledExactlyOnceWith('old-access');
    expect(authorizations).toEqual(['Bearer old-access', 'Bearer new-access']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops after a second 401 instead of refreshing indefinitely', async () => {
    vi.mocked(http.refreshAccessToken).mockResolvedValue('new-access');
    fetchMock.mockImplementation(async () => new Response('{"code":1002,"message":"Expired"}', { status: 401 }));
    await expect(sse.runSseStream('/stream', {})).rejects.toMatchObject({ status: 401, code: 1002, message: 'Expired' });
    expect(http.refreshAccessToken).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
