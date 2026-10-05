const ENDPOINT = '/api/prompt';
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 1200;

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
  });

// Pollinations sits behind this same-origin route rather than being called
// directly. The upstream host challenges browser requests with Turnstile, and
// a server-side call also keeps the system prompt out of the shipped bundle.
export const sendTurn = async ({ messages, signal }) => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const isLast = attempt === MAX_ATTEMPTS - 1;
    let response;

    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({ messages }),
      });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      if (isLast) throw new Error('Could not reach the server. Check your connection.');
      await sleep(RETRY_BASE_MS * (attempt + 1), signal);
      continue;
    }

    if (response.status === 429 || response.status >= 500) {
      if (isLast) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error || 'The model is busy right now. Wait a moment and send again.');
      }
      await sleep(RETRY_BASE_MS * (attempt + 1), signal);
      continue;
    }

    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new Error(detail?.error || `Request failed (${response.status}).`);
    }

    const data = await response.json();
    if (!data?.content) throw new Error('The model returned an empty response. Try rephrasing.');

    return { content: data.content, truncated: Boolean(data.truncated) };
  }

  throw new Error('The model did not respond. Try again.');
};