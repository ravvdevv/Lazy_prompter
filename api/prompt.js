import { runPrompt } from './handler.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { status, body } = await runPrompt({ messages: req.body?.messages, env: process.env });
  return res.status(status).json(body);
}