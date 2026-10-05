# Lazy Prompter

Describe what you need a prompt for. Get back a structured prompt you can paste
straight into ChatGPT, Claude, or Gemini. Ask for changes and the prompt gets
rewritten instead of restarted.

## Running it

```bash
bun install
bun dev          # http://localhost:5173
bun run build
bun run lint
```

## How it works

The app calls Pollinations through a same-origin serverless function at
`api/prompt.js`. That is not incidental: the upstream host answers browser
requests with a Cloudflare Turnstile challenge, so calling it directly from the
browser fails. The Vite dev server mounts the same handler locally, so
development and production share one code path.

The endpoint has no system message, so the instructions in
`config/prompts/systemPrompt.js` are prefixed to the conversation instead. That
also keeps the prompt out of the shipped bundle.

## Configuration

Everything works without configuration. For reliability, add a key:

```bash
cp .env.example .env
```

Get a key at [enter.pollinations.ai/keys](https://enter.pollinations.ai/keys).
With `POLLINATIONS_API_KEY` set, the function uses
`gen.pollinations.ai/v1/chat/completions`, which supports a real system message
and a token cap. Without it, the function uses the anonymous shared tier, which
occasionally returns 503 because the shared key is out of budget.

## Storage

Chats live in `localStorage` under `lazyprompter.sessions.v1`. Nothing leaves
the browser except the conversation text sent to Pollinations.

## License

ISC. See [LICENSE](LICENSE).