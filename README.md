# Brandee — AI Chat Agent

A full-stack animated AI chat web app built with Next.js 16, featuring a state-driven SVG avatar, Groq LLM backend, and Framer Motion animations.

## Features

- Animated SVG avatar with four states: Idle, Listening, Thinking, Speaking
- Word-by-word typing simulation for Brandee's responses
- Conversation history persisted in `localStorage`
- Per-IP rate limiting via Upstash Redis
- Session cookie authentication (production)
- Zod validation on both client and server
- Responsive layout — avatar top on mobile, side-by-side on desktop

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Frontend | React 19.2 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion v12 |
| LLM | Groq (`llama-3.3-70b-versatile`) |
| Validation | Zod v4 |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`) |
| Testing | Vitest v4 |

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd brandee
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | From [console.groq.com/keys](https://console.groq.com/keys) |
| `COOKIE_SECRET` | Yes | Random secret for signing session cookies |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token (rate limiting) |

**Generate a `COOKIE_SECRET`:**

```bash
openssl rand -hex 32
```

**Groq API key:** Sign up free at [console.groq.com](https://console.groq.com) — no credit card required.

**Upstash Redis (optional locally):** Rate limiting is skipped gracefully when these vars are absent. In production, connect via the Vercel Storage marketplace integration and the vars are injected automatically.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Run tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts   # Groq API handler
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── avatar/             # SVG avatar + state indicators
│   └── chat/               # Chat panel, messages, input
├── hooks/
│   └── useChat.ts          # Chat state, typing simulation, localStorage
├── lib/
│   ├── schema.ts           # Shared Zod validation schema
│   └── token.ts            # HMAC session token sign/verify
├── proxy.ts                # Next.js middleware — rate limiting + cookie auth
└── types/
    └── index.ts
```

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add `GROQ_API_KEY` and `COOKIE_SECRET` as environment variables
4. Optionally connect Upstash Redis via **Storage → Connect Store** (vars injected automatically)
5. Deploy

## Security

- **Session cookies** — HMAC-SHA256 signed, `httpOnly`, `sameSite: strict`, `secure` in production. Enforced whenever `COOKIE_SECRET` is set.
- **Input validation** — Zod schema enforced on both client and server. Roles `system`/`tool` are rejected to prevent prompt injection.
- **Rate limiting** — 15 requests per IP per minute via Upstash sliding window.
- **No CORS needed** — frontend and API share the same origin.
