# Brandee — AI Chat Agent

A full-stack animated AI chat web app built with Next.js 16, featuring a state-driven SVG avatar, Groq LLM backend, and Framer Motion animations.

**Live demo:** [https://brandee-carlos.vercel.app/](https://brandee-carlos.vercel.app/)

## Features

- Animated SVG avatar with four states: Idle, Listening, Thinking, Speaking
- Word-by-word typing simulation for Brandee's responses
- Conversation history persisted in `localStorage`
- Per-IP rate limiting via Upstash Redis
- Session cookie authentication (production)
- Zod validation on both client and server
- Responsive layout — avatar top on mobile, side-by-side on desktop

## Setup

### 1. Clone and install

```bash
git clone git@github.com:carlosconnected/brandee.git
cd brandee
npm install
```

### 2. Configure environment variables

This project uses two env files:

- **`.env.example`** — committed to git, contains placeholder values. Never put real secrets here.
- **`.env`** — gitignored (blocked from being able to be committed to repo), contains your real secrets for local development and is also used as the source of truth when setting variables in Vercel.

> [!WARNING]
> **Never commit `.env` or any file containing real API keys, tokens, or secrets to the repository.** Only `.env.example` with placeholder values should be committed. Leaked secrets must be rotated immediately.

Copy the example and fill in your values:

```bash
cp .env.example .env
```

| Variable                   | Description                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `GROQ_API_KEY`             | From [console.groq.com/keys](https://console.groq.com/keys) — free, no credit card         |
| `COOKIE_SECRET`            | Random secret for signing session cookies (generate below)                                 |
| `UPSTASH_REDIS_REST_URL`   | From your Upstash database dashboard at [console.upstash.com](https://console.upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | From your Upstash database dashboard                                                       |

**Generate a `COOKIE_SECRET`:**

```bash
openssl rand -hex 32
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Layer           | Technology                           | Why                                                                                                                                                  |
| --------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router)              | Handles both the frontend and the API in a single project, with built-in middleware, server-side rendering, and seamless Vercel deployment           |
| Language        | TypeScript 5                         | Catches bugs at compile time rather than at runtime, makes the codebase easier to understand and refactor safely                                     |
| Frontend        | React 19.2                           | Industry-standard UI library with the React Compiler enabled, which automatically optimises re-renders without manual tuning                         |
| Styling         | Tailwind CSS v4                      | Utility-first approach keeps styles co-located with components and eliminates unused CSS in production automatically                                 |
| Animation       | Framer Motion v12                    | Best-in-class animation library for React — declarative, performant, and handles complex state transitions like the avatar indicator changes cleanly |
| LLM             | Groq (`llama-3.3-70b-versatile`)     | Extremely fast inference speeds make the chat feel responsive; generous free tier and no credit card required to get started                         |
| Validation      | Zod v4                               | Defines the data schema once and reuses it on both the client and the server, keeping validation logic consistent and type-safe                      |
| Rate limiting   | Upstash Redis (`@upstash/ratelimit`) | Serverless-native Redis with a simple sliding window API — no infrastructure to manage, and integrates directly with Vercel                          |
| Automated tests | Vitest v4                            | Faster than Jest, native TypeScript and ESM support, and a Jest-compatible API so there's no learning curve                                          |

## How the AI Agent Works

### 1. Input Validation

Before your message is even sent, the app checks that it's not too long — anything over 2,000 characters gets blocked. A character counter is always visible so you know exactly how much space you have left. It also makes sure the conversation history is in the expected format, and blocks anyone from sneaking in hidden instructions disguised as a normal message.

**Why it matters:** The character limit keeps things running smoothly and prevents people from trying to overwhelm the AI with massive walls of text. The other checks make sure the AI always behaves as intended — nobody can slip in a backdoor instruction to make it act differently.

### 2. Session Check

Every time you send a message, your browser automatically includes a hidden, tamper-proof stamp that proves your request is coming from the real Brandee website — not from someone trying to fake it.

**Why it matters:** Think of it like a wax seal on a letter. If someone intercepts the letter and tries to reseal it, the seal looks broken. Here, if anyone tries to forge or tamper with that stamp, the server immediately rejects the request. This means only real visitors using the actual website can talk to the AI — not bots or hackers trying to access it from the outside.

### 3. Rate Limiting

The server tracks how many messages each user sends per minute. If someone exceeds 15 requests in 60 seconds, they're temporarily blocked and told when to try again.

**Why it matters:** Prevents abuse. Without this, a bot could flood your app with thousands of requests, running up your API bill or making the service slow for everyone else.

### 4. The AI Call

Once everything checks out, the app sends your conversation (up to the last 20 messages, capped at 16,000 characters) to a powerful AI model, along with a fixed set of instructions that define how it should behave.

**Why it matters:** Keeping a recent history lets the AI understand context — it knows what was said earlier in the conversation. The fixed instructions ensure the AI stays on-brand and on-topic, no matter what users ask.

### 5. Typing Simulation

Instead of the full reply appearing instantly, words appear one at a time at a natural reading pace (about 38ms per word).

**Why it matters:** It feels more like talking to a person than reading a database dump. This small detail dramatically improves how trustworthy and pleasant the experience feels.

### 6. Persistence

Your conversation is saved in the browser so that if you refresh the page or accidentally close the tab, your chat history is still there.

**Why it matters:** Nobody wants to lose a conversation they just had. This makes the experience feel reliable and polished — like a real product, not a prototype.

## How Animation States Are Handled

The avatar has four states defined in `src/types/index.ts`:

| State       | When                            | Visual                                                      |
| ----------- | ------------------------------- | ----------------------------------------------------------- |
| `idle`      | No activity                     | Floating Z's above the avatar                               |
| `listening` | User is typing                  | Sound-wave arcs on both sides of the head                   |
| `thinking`  | Waiting for Groq response       | Speech bubble with three bouncing dots                      |
| `speaking`  | Brandee is typing out her reply | Six lines fanning from the mouth corners, pulsing in purple |

State is managed in `useChat.ts` and flows down as a single `state: AgentState` prop. The `Avatar` component passes it to `IndicatorLayer`, which uses Framer Motion's `AnimatePresence` to fade between indicator components as the state changes. Each indicator is a self-contained SVG overlay with its own looping Framer Motion animation — no global animation state or timers shared between them.

## What I'd Improve With More Time

### 1. Multiple Conversations

Right now the app supports a single ongoing conversation. With more time, I would allow users to start fresh chats, switch between past conversations, and organize them — similar to how ChatGPT or Claude handle conversation history.

### 2. Voice Input

Adding a microphone button would let users speak their messages instead of typing them — making the interaction feel more natural, especially on mobile.

### 3. Voice Output

The agent would also be able to speak its replies out loud, turning the experience into a true two-way voice conversation — much closer to talking to a real person.

### 4. File & Media Attachments

Allow users to attach documents such as documents, images, audio, and video files as part of the conversation. this would let Brandee analyze a contract, describe an image, transcribe an audio clip, or even watch a video to identify problems, follow instructions, or extract key information — making the agent significantly more versatile and useful in real-world scenarios.

### 5. Better Avatar & Animation

The current avatar is functional but basic. I would invest in a higher-quality design with smoother, more expressive animations — making the experience feel more lifelike and engaging.

### 6. User Accounts

Adding a proper sign-up and sign-in flow would let the app remember who you are across devices and sessions, and give each user their own private, personalized experience.

### 7. More Layers of Security

With user accounts in place, additional security measures become possible — such as email verification, password protection, and tying conversations to a specific user rather than just a browser. This makes the app significantly more robust and trustworthy.

### 8. Multilingual Support

Allow users to interact with the agent in their preferred language. This opens the app up to a much wider audience and makes it feel more inclusive.

### 9. Conversation Export

Let users download or share their conversation as a PDF or text file — useful if the agent gave them valuable advice they want to save or reference later.

### 10. Feedback System

Add a simple thumbs up / thumbs down button on each reply. This helps identify where the agent is performing well and where it needs improvement.

### 11. Analytics Dashboard

Track how users interact with the app — most common questions, average session length, drop-off points. This data would be invaluable for improving the product over time.

### 12. Mobile App

Package the experience as a native iOS and Android app for a smoother, faster experience on phones — with access to features like push notifications and the device microphone.

### 13. Personality Customization

Let users adjust the agent's tone — more formal, more casual, more concise — so the experience feels tailored to their preference.

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

## Automated Tests

Brandee ships with a full automated test suite powered by Vitest. Tests run in under 2 seconds and cover every critical layer of the application.

### Why Tests Matter

Every time you change the code, there's a risk of accidentally breaking something that was already working. Tests are a safety net — they run automatically and immediately tell you if something broke, so you catch the problem before users do. They also act as living documentation: each test describes exactly what the app is supposed to do, making it easy for anyone to understand the expected behavior without reading through the source code.

### What's Covered

| Area               | What's tested                                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Message schema** | Valid messages pass; system role injection is rejected; empty content, oversized messages, and out-of-bounds arrays are all blocked                                              |
| **API route**      | Valid requests return a reply; every invalid input returns the correct error code; Groq failures return a 500                                                                    |
| **Middleware**     | Cookie is issued on first page visit; stale or invalid cookies are replaced; missing cookie returns 401; rate limit exceeded returns 429 with correct headers                    |
| **Session tokens** | Tokens are unique on every call; valid tokens verify correctly; tampered nonces, forged signatures, and malformed strings are all rejected                                       |
| **Chat input UI**  | Error message appears when over the character limit; counter shows when approaching the limit; send button is disabled when empty or over limit; clicking send calls the handler |

### Running the Tests

```bash
npm test            # run once and exit
npm run test:watch  # re-run on every file change (great during development)
```

## Deployment

### Vercel (where the demo is deployed)

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add all variables from your `.env` file as environment variables in the Vercel project settings
4. Deploy

## Security

### Session Cookies

When you first visit the site, the server quietly places a hidden, digitally signed stamp in your browser — like a unique wristband at a concert. Every time you send a message, your browser shows that wristband automatically. The server checks that the wristband is genuine before doing anything. If someone tries to forge it or send a request without one, they're immediately turned away. The stamp is invisible to JavaScript, only travels over encrypted connections in production, and is tied to your domain — so other websites can't steal or replicate it.

### Input Validation

Every message is checked twice — once in the browser before it's sent, and again on the server when it arrives. This catches accidental mistakes (like a message that's too long) and intentional attacks (like someone trying to sneak hidden instructions into the conversation to make the AI behave differently). Think of it as a bouncer at the door who checks IDs on the way in and again at the bar.

### Rate Limiting

The server keeps a count of how many messages each visitor sends per minute. If someone goes over 15 messages in 60 seconds, they're temporarily blocked and told exactly when they can try again. This prevents bots or bad actors from spamming the AI thousands of times in a row, which would run up the API bill and slow things down for everyone else.

### Same-Origin API

The chat API only accepts requests from the same website it lives on. A completely different website cannot embed or call this API — the browser enforces this automatically. No extra configuration needed.
