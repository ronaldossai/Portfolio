// Vercel serverless function: POST /api/chat
// Streams a Claude reply as plain text. Requires ANTHROPIC_API_KEY in the
// Vercel project's environment variables (never exposed to the browser).

const Anthropic = require('@anthropic-ai/sdk').default;
const { SYSTEM_PROMPT } = require('./_profile');

const client = new Anthropic();

const MAX_TURNS = 12; // most recent messages sent to the model
const MAX_CHARS = 1000; // per visitor message
const RATE_LIMIT = 20; // requests per IP per window
const RATE_WINDOW_MS = 10 * 60 * 1000;

// Best-effort in-memory limiter. It resets on cold starts and is per instance,
// so it slows down casual abuse; a spend limit on the API key is the real cap.
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

// Accept only well-formed, alternating user/assistant text turns ending on a user message.
function sanitize(messages) {
  if (!Array.isArray(messages)) return null;
  const clean = messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim()
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  while (clean.length && clean[0].role !== 'user') clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== 'user') return null;
  for (let i = 1; i < clean.length; i++) {
    if (clean[i].role === clean[i - 1].role) return null;
  }
  return clean;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "You're sending messages quickly. Try again in a few minutes." });
  }

  const messages = sanitize(req.body && req.body.messages);
  if (!messages) {
    return res.status(400).json({ error: 'Invalid conversation.' });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = client.beta.messages.stream({
      model: 'claude-opus-5-5',
      max_tokens: 4096,
      output_config: { effort: 'low' }, // short chat answers; keeps latency and cost down
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // re-run on a fallback model if a safety classifier declines
      cache_control: { type: 'ephemeral' },
      system: SYSTEM_PROMPT,
      messages,
    });

    stream.on('text', (text) => res.write(text));
    const final = await stream.finalMessage();

    if (final.stop_reason === 'refusal') {
      res.write("\n\nSorry, I can't help with that one. Ask me about Ronald's experience, skills or projects.");
    }
    res.end();
  } catch (error) {
    console.error('chat error', error);
    const message =
      error instanceof Anthropic.RateLimitError
        ? 'The assistant is busy right now. Please try again in a moment.'
        : 'Something went wrong reaching the assistant. Please try again.';
    if (!res.headersSent) {
      return res.status(error instanceof Anthropic.APIError ? 502 : 500).json({ error: message });
    }
    res.end(`\n\n${message}`);
  }
};
