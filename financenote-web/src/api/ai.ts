/**
 * AI 研读助手 SSE 流式传输 Fetch 请求工具类 (ai.ts)
 */

export interface SourceInfo {
  id?: string;
  pageNumber: number;
  snippet?: string;
}

export function streamAiAnswerFetch(
  docId: string | undefined,
  query: string,
  currentPage: number | undefined,
  conversationId: string | undefined,
  onConversationId: (id: string) => void,
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
    body: JSON.stringify({ docId: docId || undefined, query, currentPage, conversationId, topK: 5 }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP 错误代码: ${response.status}`);
      }
      const streamReader = response.body?.getReader();
      if (!streamReader) throw new Error('服务器未返回可读取的流');
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let completed = false;

      const finish = () => {
        if (completed) return;
        completed = true;
        onDone();
      };

      function read() {
        streamReader!.read().then(({ done, value }) => {
          if (done) {
            buffer += decoder.decode();
            finish();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const jsonStr = line.replace('data:', '').trim();
                if (!jsonStr) continue;
                const parsed = JSON.parse(jsonStr);
                if (parsed.conversationId) onConversationId(parsed.conversationId);

                if (parsed.type === 'sources') {
                  onSources(parsed.sources || []);
                } else if (parsed.type === 'text') {
                  onChunk(parsed.content || '');
                } else if (parsed.type === 'done') {
                  finish();
                } else if (parsed.type === 'error') {
                  completed = true;
                  onError(parsed.message);
                }
              } catch (e) {}
            }
          }
          read();
        }).catch(onError);
      }

      read();
    })
    .catch(onError);
}
