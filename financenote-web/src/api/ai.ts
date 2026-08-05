/**
 * AI 研读助手 SSE 流式传输 Fetch 请求类 (ai.ts)
 * 
 * 作用：
 * 由于 EventSource 默认无法添加 Authorization: Bearer <Token> 请求头，
 * 使用原生 fetch() API + ReadableStream 实例读取后端流式推送的数据，
 * 实现与前端与 NestJS SSE 控制器的优雅解包打字机通信。
 */

export interface SourceInfo {
  pageNumber: number;
  snippet: string;
}

export function streamAiAnswerFetch(
  docId: string,
  query: string,
  onSources: (sources: SourceInfo[]) => void,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: any) => void
) {
  const token = localStorage.getItem('fn_access_token');

  fetch('/api/ai/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ docId, query, topK: 5 }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP 错误代码: ${response.status}`);
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      function read() {
        reader?.read().then(({ done, value }) => {
          if (done) {
            onDone();
            return;
          }
          const rawData = decoder.decode(value, { stream: true });
          const lines = rawData.split('\n');

          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const jsonStr = line.replace('data:', '').trim();
                if (!jsonStr) continue;
                const parsed = JSON.parse(jsonStr);

                if (parsed.type === 'sources') {
                  onSources(parsed.sources || []);
                } else if (parsed.type === 'text') {
                  onChunk(parsed.content || '');
                } else if (parsed.type === 'done') {
                  onDone();
                } else if (parsed.type === 'error') {
                  onError(parsed.message);
                }
              } catch (e) {
                // 自动忽略格式不全的中间 chunk
              }
            }
          }
          read();
        }).catch(onError);
      }

      read();
    })
    .catch(onError);
}
