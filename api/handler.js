import systemPrompt from '../config/prompts/systemPrompt.js';

const ANON_ENDPOINT = 'https://text.pollinations.ai/';
const KEYED_ENDPOINT = 'https://gen.pollinations.ai/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-oss-20b';
const MAX_HISTORY = 6;
const MAX_TOKENS = 1200;
const SYSTEM = systemPrompt.trim();

// This endpoint answers some failures with HTTP 200 and an explanation in the
// body. Without this check a quota message would be served to the user as
// though it were the prompt they asked for.
const ERROR_MARKERS =
  /turnstile|has reached its budget|payment required|unauthorized|rate limit|too many requests|"error"\s*:/i;

const looksTruncated = (text) => {
  const tail = text.trimEnd().slice(-1);
  return tail.length > 0 && !/[.!?:;"')\]}>*]$/.test(tail);
};

const stripFences = (text) =>
  text
    .replace(/^```[a-zA-Z]*\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();

const normalise = (messages) =>
  (Array.isArray(messages) ? messages : [])
    // Drop the oldest turns first so the most recent request always survives.
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY);

const askKeyed = async (history, key, model) => {
  const response = await fetch(KEYED_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      // Authenticated path: a real system message, so the instructions do not
      // have to be folded into a URL.
      messages: [{ role: 'system', content: SYSTEM }, ...history],
      max_tokens: MAX_TOKENS,
    }),
  });

  if (response.status === 402) {
    return { status: 402, body: { error: 'The Pollinations key is out of credit. Top it up at enter.pollinations.ai/keys.' } };
  }
  if (response.status === 429) {
    return { status: 429, body: { error: 'Rate limited by Pollinations. Wait a moment and send again.' } };
  }
  if (!response.ok) {
    return { status: 502, body: { error: `Pollinations returned ${response.status}.` } };
  }

  const payload = await response.json();
  return { status: 200, body: { content: payload?.choices?.[0]?.message?.content ?? '' } };
};

const askAnonymous = async (history) => {
  const transcript = history
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const prompt = `${SYSTEM}\n\n<conversation>\n${transcript}\n</conversation>\n\nReturn the prompt for the last User message.`;

  const response = await fetch(ANON_ENDPOINT + encodeURIComponent(prompt), {
    headers: {
      Accept: 'text/plain',
      // The user agent matters. The upstream CDN challenges browser-shaped
      // requests with Turnstile, and this call never originates from a browser.
      'User-Agent': 'lazy-prompter/1.0 (+https://lazyprompts.vercel.app)',
    },
  });

  if (!response.ok) {
    return { status: 502, body: { error: `Pollinations returned ${response.status}.` } };
  }

  return { status: 200, body: { content: await response.text() } };
};

// Transport-agnostic on purpose: the Vercel function and the Vite dev
// middleware both call this, so local and deployed behaviour cannot drift.
export const runPrompt = async ({ messages, env = {} }) => {
  const history = normalise(messages);

  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return { status: 400, body: { error: 'Send at least one user message.' } };
  }

  const key = env.POLLINATIONS_API_KEY;

  let result;
  try {
    result = key
      ? await askKeyed(history, key, env.POLLINATIONS_MODEL || DEFAULT_MODEL)
      : await askAnonymous(history);
  } catch {
    return { status: 502, body: { error: 'Could not reach Pollinations.' } };
  }

  if (result.status !== 200) return result;

  const raw = result.body.content;
  if (!raw || !raw.trim()) {
    return { status: 502, body: { error: 'Pollinations returned an empty response.' } };
  }

  if (ERROR_MARKERS.test(raw.slice(0, 300))) {
    // The anonymous tier shares one key across all users, and it runs out. An
    // API key removes this failure mode entirely.
    return {
      status: 503,
      body: { error: 'The free Pollinations tier is busy right now. Try again in a moment.' },
    };
  }

  const content = stripFences(raw);
  if (!content) return { status: 502, body: { error: 'Pollinations returned an empty response.' } };

  return { status: 200, body: { content, truncated: looksTruncated(content) } };
};