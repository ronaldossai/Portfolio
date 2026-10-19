import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Placeholder mode: canned answers, no network calls, no API cost.
// Set to true once ANTHROPIC_API_KEY is configured on Vercel to use /api/chat.
const LIVE_AI = false;

const PLACEHOLDER_ANSWERS = {
  "What's Ronald's experience with AI?":
    'Ronald holds a BSc in Computer Science and Artificial Intelligence from the University of Sussex, covering machine learning, neural networks, computer vision and NLP. At KodyPay he built an AI-powered Slack bot that summarises critical channels every 24 hours.',
  'Which projects best show his frontend skills?':
    'The Interactive Standard Model (React, TypeScript, Three.js) and this portfolio itself are the best examples. He also built a full-stack React/Remix admin system as a contract developer at Cartographer IO.',
  'Is he a fit for a full-stack role?':
    'Likely, yes. He has shipped React/TypeScript frontends, Django and ASP.NET backends, Docker deployments and CI/CD pipelines, including a year in the Solutions Architect team at Allianz.',
};

const PLACEHOLDER_FALLBACK =
  "The live AI assistant is coming soon. In the meantime, try one of the suggested questions, or reach Ronald through the Contact form or LinkedIn.";

const SUGGESTIONS = [
  "What's Ronald's experience with AI?",
  'Which projects best show his frontend skills?',
  'Is he a fit for a full-stack role?',
];

const GREETING = {
  role: 'assistant',
  content: LIVE_AI
    ? "Hi! I'm an AI assistant trained on Ronald's CV and projects. Ask me anything about his work."
    : "Hi! This assistant is in preview. Pick a suggested question to see how it works.",
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || loading) return;

    // The greeting is UI-only; the API expects the conversation to start with the user.
    // Failed exchanges stay visible but are left out so turns keep alternating.
    const history = [
      ...messages.slice(1).filter((m) => !m.error && !m.failed),
      { role: 'user', content },
    ];
    setMessages((prev) => [...prev, { role: 'user', content }, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    const appendToReply = (chunk) =>
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content + chunk };
        return next;
      });

    if (!LIVE_AI) {
      // Simulate streaming so the preview feels like the real thing.
      const reply = PLACEHOLDER_ANSWERS[content] || PLACEHOLDER_FALLBACK;
      const words = reply.split(/(?<= )/);
      for (const word of words) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        appendToReply(word);
      }
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'The assistant is unavailable right now.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToReply(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -2),
        { ...prev[prev.length - 2], failed: true },
        { role: 'assistant', content: err.message, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const showSuggestions = messages.length === 1;

  return (
    <div className="fixed bottom-6 right-4 md:right-8 lg:right-20 z-50 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-96 h-[32rem] max-h-[75vh] flex flex-col bg-primary border border-tertiary rounded-lg shadow-2xl overflow-hidden"
            role="dialog"
            aria-label="Chat with Ronald's AI assistant"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-tertiary">
              <div>
                <p className="text-light font-semibold text-sm">Ask about Ronald</p>
                <p className="text-dark text-xs font-mono">{LIVE_AI ? 'Powered by Claude' : 'Preview'}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-dark hover:text-secondary transition-colors"
                aria-label="Close chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${
                      m.role === 'user'
                        ? 'bg-secondary text-primary'
                        : m.error
                        ? 'bg-tertiary text-red-400'
                        : 'bg-tertiary text-light'
                    }`}
                  >
                    {m.content || (
                      <span className="inline-flex gap-1" aria-label="Thinking">
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {showSuggestions && (
                <div className="flex flex-col items-start gap-2 pt-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-xs font-mono text-secondary border border-secondary/40 rounded px-3 py-1.5 hover:bg-secondary/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-tertiary">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={1000}
                placeholder="Ask a question..."
                className="flex-1 bg-tertiary text-light text-sm rounded px-3 py-2 placeholder-dark focus:outline-none focus:ring-1 focus:ring-secondary"
                aria-label="Your message"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-secondary text-primary rounded px-3 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-secondary/90 transition-colors"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-secondary text-primary font-semibold rounded-full shadow-lg px-4 py-3"
        aria-expanded={open}
        aria-label={open ? 'Close chat' : 'Open chat with AI assistant'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span className="text-sm">{open ? 'Close' : 'Ask AI'}</span>
      </motion.button>
    </div>
  );
};

export default ChatWidget;
