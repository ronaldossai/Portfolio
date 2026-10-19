# Portfolio
My personal portfolio website showcasing my current crop of skills.  <br /> Can be found hosted on ronaldossai.xyz

## AI assistant
The "Ask AI" chat widget answers visitor questions about my experience and projects using the Claude API (`claude-opus-5-5`), streamed token by token.

- `src/components/ChatWidget.js` — chat UI
- `api/chat.js` — Vercel serverless function that calls Claude; the API key never reaches the browser
- `api/_profile.js` — the knowledge base and system prompt (update this when the CV changes)

Setup: add `ANTHROPIC_API_KEY` under Vercel → Project Settings → Environment Variables. For local development, run `vercel dev` (plain `npm start` doesn't serve `/api`).
