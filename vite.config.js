import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { runPrompt } from './api/handler.js';

// Vite's dev server does not serve Vercel functions, so /api/prompt 404s under
// `vite dev`. This mounts the same handler locally, which keeps development and
// production on one code path.
const apiDevServer = () => ({
  name: 'api-dev-server',
  configureServer(server) {
    server.middlewares.use('/api/prompt', async (req, res) => {
      res.setHeader('Content-Type', 'application/json');

      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed.' }));
        return;
      }

      let messages;
      try {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        messages = JSON.parse(raw || '{}').messages;
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Malformed request body.' }));
        return;
      }

      const { status, body } = await runPrompt({ messages, env: process.env });
      res.statusCode = status;
      res.end(JSON.stringify(body));
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevServer()],
  build: {
    sourcemap: false,
  },
});