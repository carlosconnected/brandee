# Brandee — AI Chat Agent

A full-stack animated AI chat web app built with Next.js 16, featuring a state-driven SVG avatar, Groq LLM backend, and Framer Motion animations.

**Live demo:** [https://brandee-carlos.vercel.app/](https://brandee-carlos.vercel.app/)
**Avatar development playground:** [https://brandee-carlos.vercel.app/playground](https://brandee-carlos.vercel.app/playground)

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

Once everything checks out, the app sends your conversation (up to the last 160 messages, capped at 80,000 characters) to a powerful AI model, along with a fixed set of instructions that define how it should behave. Older messages stay visible on screen and in your local history — only the request payload is trimmed, so the conversation never silently truncates from your point of view.

**Why it matters:** Keeping a recent history lets the AI understand context — it knows what was said earlier in the conversation. The fixed instructions ensure the AI stays on-brand and on-topic, no matter what users ask. Trimming server-side requests (without trimming the visible chat) keeps responses fast and predictable as the conversation grows.

### 5. Personality Cues

Brandee can react visually to what she's saying. Her system prompt allows the model to optionally prefix a reply with `[CELEBRATE]` (good news, accomplishments) or `[CONFUSED]` (genuine misunderstanding, errors). The server strips the tag before the reply ever reaches the screen and forwards a `cue` field to the client, which plays a short arms-up or head-tilt reaction on the avatar.

**Why it matters:** It turns the avatar from a static decoration into an emotional participant in the conversation. The model decides when to react — there's no keyword matching or sentiment-classifier hack — so the celebration or confusion lands at exactly the moments where a real person would react that way.

### 6. Typing Simulation

Instead of the full reply appearing instantly, words appear one at a time at a natural reading pace (about 50ms per word).

**Why it matters:** It feels more like talking to a person than reading a database dump. This small detail dramatically improves how trustworthy and pleasant the experience feels.

### 7. Voice Greeting

The first time you sign in on any given day, Brandee waves and says "Hi {name}. How can I help you today?" out loud. A small `localStorage` latch makes sure this happens exactly once per day, even with React's Strict Mode running effects twice in development.

**Why it matters:** A spoken greeting on first sign-in immediately establishes that this is a voice-capable agent — not just a text chat with a face. Limiting it to once a day keeps the experience charming instead of repetitive.

### 8. Dictation

A microphone button next to the input lets you speak a single message instead of typing it. Your words appear live in the input box as you talk; when you stop, the transcript stays in the input so you can review and edit before sending. The reply is read out loud, since the message was composed by voice.

**Why it matters:** Dictation removes friction on mobile, where typing is slow, and gives anyone who finds the keyboard tiring an equally first-class way to interact. Letting you review the transcript before sending avoids the "voice assistant misheard me and ran with it" frustration.

### 9. Hands-Free Voice Mode

A headphones button toggles a continuous voice mode: the mic listens, auto-sends after a 2-second silence, the reply plays through TTS, and the mic re-arms once the reply finishes — all without you touching the screen. Toggling the button off (or hitting the conversation cap) gracefully exits.

Because speech recognition strips punctuation, a small heuristic restores question marks when an utterance opens with a wh-word or fronted auxiliary verb — so "what's the capital of Italy" arrives as "what's the capital of Italy?" rather than a flat statement.

**Why it matters:** It turns Brandee into a true two-way voice conversation, not just a chat with optional voice features. The punctuation heuristic is a small touch but matters a lot — questions lose their meaning when read back as statements, and even modern speech APIs still don't add punctuation reliably.

### 10. Persistence

Your conversation is saved in the browser so that if you refresh the page or accidentally close the tab, your chat history is still there. When the conversation does eventually approach its cap, a modal offers two options: trim the older half (preserving your recent context) or clear the entire chat for a fresh start.

**Why it matters:** Nobody wants to lose a conversation they just had. This makes the experience feel reliable and polished — like a real product, not a prototype. Giving the user a clean choice when they hit the limit, instead of just blocking them, respects how invested they may be in the current thread.

## How Animation States Are Handled

Brandee is a fully illustrated character composed of pre-rendered PNG frames, not an SVG with overlay indicators. There are nine distinct states, each with its own set of frames, and the character is composited onto a desk so she physically reacts to what's happening in the conversation (waking up, leaning forward, throwing arms up, etc.).

### The Nine States

Defined in `src/types/index.ts`:

| State         | When                                                       | Visual                                                                                                          |
| ------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `greeting`    | First sign-in of the day                                   | Two-frame waving animation; a TTS hello plays alongside it                                                      |
| `idle`        | Default resting state                                      | Eyes-open + eyes-closed frames cycle to produce a natural blink every ~6s                                       |
| `bored`       | ~45s with no activity                                      | Slumped pose, eyes elsewhere                                                                                    |
| `sleeping`    | ~45s after entering `bored` (≈90s total idle)              | Head down on the desk, "Z" frames                                                                               |
| `listening`   | User is typing or actively dictating                       | Leaning in, attentive pose                                                                                      |
| `thinking`    | Waiting on the Groq response                               | Hand-on-chin pose                                                                                               |
| `speaking`    | Brandee is typing out / TTS-ing her reply                  | Two-frame mouth animation                                                                                       |
| `celebrating` | Cued by the LLM when the reply warrants it (e.g. praise)   | Arms-up two-frame loop; auto-returns to `idle` after 3s                                                         |
| `confused`    | Cued by the LLM on confused replies, or on a network error | Tilted-head two-frame loop; auto-returns to `idle` after 3s                                                     |

Frame data, hold times, and which states use multiple frames live in `src/components/brandee/constants.ts` (`STATE_TO_FRAMES`).

### The State Machine — `useBrandeeState`

A single `useReducer`-backed hook (`src/components/brandee/useBrandeeState.ts`) owns the entire state machine. It exposes a stable `setState(next)` and `reportActivity()` pair, and internally manages every timer-driven transition:

- **Greeting auto-play** — `greeting → idle` after `TIMINGS.greetingDuration` (5.5s, long enough to outlast the spoken greeting)
- **Idle escalation** — `idle → bored` after 45s of no activity, then `bored → sleeping` after another 45s
- **Wake-up on activity** — any `reportActivity()` call (click, key press, focus) bumps the activity tick, which resets idle timers and snaps `bored`/`sleeping` back to `idle`
- **Auto-return** — `celebrating` and `confused` each return to `idle` after 3s on their own

The chat layer drives the conversational states (`listening`, `thinking`, `speaking`, `celebrating`, `confused`) by calling `setBrandeeState(...)` from `useChat.ts` and `ChatInput.tsx`. The state machine handles everything else.

### Cross-Fades and Transition Frames

Switching between certain state pairs plays an intermediate pose so the character doesn't snap awkwardly. There are two kinds, declared in `constants.ts`:

- **Single-frame transitions** (`TRANSITIONS`) — e.g. `idle → listening` shows `idle-to-listening.png` for `TIMINGS.singleTransitionHold` (600ms), then cross-fades into the new state.
- **Multi-frame sequences** (`TRANSITION_SEQUENCES`) — for cinematic moments like waking up, where `sleeping → listening` plays `waking-up.png` (800ms) then `bored-to-listening.png` (500ms) before resolving.

State pairs without a defined transition just cross-fade directly. The active transition frame, if any, is exposed alongside the state via `transitionFrame` and rendered by `BrandeeImage`.

### Compositing onto the Desk — Per-State Layouts

Each PNG was illustrated independently, so the character's body sits at a slightly different position in every frame. To keep her grounded on the desk through every state and transition, `<BrandeeWithDesk>` (`src/components/brandee/BrandeeWithDesk.tsx`) reads per-asset layout values from `src/components/brandee/layouts.ts`:

| Field         | Purpose                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `bodyBottomY` | Y coordinate where the bottom of the character's body sits, in reference pixels (stage width = 420) |
| `bodyX`       | Horizontal offset from stage center                                                                  |
| `behindBase`  | When `true`, the desk renders above the character (arms hide behind the surface)                     |

Both `STATE_LAYOUTS` (one per state) and `FRAME_LAYOUTS` (overrides for individual transition frames) are stored in the file. The wrapper scales these reference values to whatever size the caller is rendering (sidebar avatar, mobile top strip, etc.).

### The `/playground` Page — Tuning UI

Tweaking layouts by hand-editing numbers is painful, so the project ships a dedicated tuning page at [`/playground`](http://localhost:3000/playground) (`src/app/playground/page.tsx`).

What it gives you:

- **State picker** — click any of the nine states or any transition frame to lock the stage to it
- **`disableAutoTransitions`** — `useBrandeeState` is initialised in playground mode so timers don't fire; the state stays put while you tune
- **Sliders** for `bodyX` and `bodyBottomY`, plus a `behindBase` toggle, all live-previewed against the actual desk
- **Trigger buttons** to fire real `setState` calls and watch single-frame and multi-frame transition sequences play out, with a per-event log showing which path was taken
- **"Copy paste-ready TS"** button that emits the entire `STATE_LAYOUTS` / `FRAME_LAYOUTS` block formatted exactly as `layouts.ts` expects — paste over the existing block and you're done

Workflow: open `/playground`, tune until everything sits cleanly on the desk, copy the generated block, paste into `layouts.ts`, commit.

## What I Improved During This Final Round

This round of work focused on turning Brandee from a competent text-only chat into something that genuinely feels alive and personal:

### 1. A New Avatar

Replaced the original four-state SVG with a fully illustrated nine-state character (greeting, idle, bored, sleeping, listening, thinking, speaking, celebrating, confused), composited onto an animated desk scene. The character now reacts to idle time, wakes up when the user comes back, leans in when they're typing, and responds emotionally to what she's saying — not just what state the chat is in.

### 2. Voice Input — Dictation and Hands-Free Mode

Added two distinct voice input flows on top of the Web Speech API: a **single-shot dictation** mic that fills the input so the user can review before sending, and a **continuous hands-free voice mode** that listens, auto-sends after a 2-second silence, and re-arms automatically once Brandee finishes replying. A small heuristic restores question marks the recognition API strips out (so "what's the capital of Italy" arrives correctly punctuated).

### 3. Voice Output — TTS Replies and Spoken Greeting

Brandee now speaks her replies out loud in voice mode using the browser's `speechSynthesis` API, with voice selection tuned to prefer natural-sounding female voices across operating systems. On the first sign-in of any given day, she also waves and greets the user by name out loud — gated by `localStorage` so it fires exactly once per day even with React Strict Mode's dev double-mount.

### 4. The Avatar Playground

Built a dedicated tuning page at [`/playground`](https://brandee-carlos.vercel.app/playground) for compositing the character on top of the desk. It exposes every state and transition frame as clickable previews, with live sliders for horizontal/vertical position and a behind-base toggle, and a one-click "Copy paste-ready TS" button that emits the entire layout block formatted exactly as `layouts.ts` expects. What used to be a slow guess-and-check loop is now a 30-second copy-paste — which is what made the nine-state, multi-frame avatar tractable in the time available.

### 5. Personalized Sign-In

Added a simple sign-in form that captures the user's name on first visit. The name is sanitized (line breaks stripped, capped at 50 characters, so a malicious name can't inject new instructions) and woven into the system prompt, so Brandee greets and addresses the user by name throughout the conversation. Small touch, but it shifts the experience from "talking to a generic agent" to "talking to someone who knows you".

## What I'd Improve With More Time

### 1. Multiple Conversations

Right now the app supports a single ongoing conversation. With more time, I would allow users to start fresh chats, switch between past conversations, and organize them — similar to how ChatGPT or Claude handle conversation history.

### 2. Better Voice Output

The current voice output relies on the browser's built-in `speechSynthesis` API, which is free but sounds robotic and varies wildly across browsers and operating systems. With more time I would integrate a proper TTS service like **ElevenLabs**, which produces natural, expressive speech with consistent quality everywhere — turning Brandee from "a chat with a synthesized voice" into something that genuinely feels like talking to a real person.

### 3. File & Media Attachments

Allow users to attach documents such as documents, images, audio, and video files as part of the conversation. this would let Brandee analyze a contract, describe an image, transcribe an audio clip, or even watch a video to identify problems, follow instructions, or extract key information — making the agent significantly more versatile and useful in real-world scenarios.

### 4. Better Avatar & Animation

The current avatar is a stack of pre-rendered PNGs driven by a state machine — functional and surprisingly expressive for what it is, but ultimately limited by the fact that every frame had to be illustrated by hand. With more time I would model and rig Brandee in proper 3D animation software (**Blender** as the practical starting point — free, industry-standard, full modeling/rigging/animation pipeline; **Unreal Engine with MetaHuman** as the higher-end option for photoreal results) and either export image sequences for the existing frame-based pipeline or render the character live in the browser via a real-time runtime. This would make every state and transition feel smoother, more lifelike, and far more engaging — without losing the state-machine architecture that already works well.

### 5. User Accounts

Adding a proper sign-up and sign-in flow would let the app remember who you are across devices and sessions, and give each user their own private, personalized experience.

### 6. More Layers of Security

With user accounts in place, additional security measures become possible — such as email verification, password protection, and tying conversations to a specific user rather than just a browser. This makes the app significantly more robust and trustworthy.

### 7. Multilingual Support

Allow users to interact with the agent in their preferred language. This opens the app up to a much wider audience and makes it feel more inclusive.

### 8. Conversation Export

Let users download or share their conversation as a PDF or text file — useful if the agent gave them valuable advice they want to save or reference later.

### 9. Feedback System

Add a simple thumbs up / thumbs down button on each reply. This helps identify where the agent is performing well and where it needs improvement.

### 10. Analytics Dashboard

Track how users interact with the app — most common questions, average session length, drop-off points. This data would be invaluable for improving the product over time.

### 11. Polished Mobile Web Experience

The app is responsive and works on phones, but I didn't have time to properly tune the mobile rendering — spacing, font sizes, the avatar's mobile top strip, on-screen keyboard handling, and the way the chat scrolls when replies stream in all need a dedicated pass. With more time I would treat mobile as a first-class layout rather than a scaled-down desktop view, and test across iOS Safari and Android Chrome to iron out the small inconsistencies that those browsers each introduce.

### 12. Mobile App

Package the experience as a native iOS and Android app for a smoother, faster experience on phones — with access to features like push notifications and the device microphone.

### 13. Personality Customization

Let users adjust the agent's tone — more formal, more casual, more concise — so the experience feels tailored to their preference.

### 14. Expanded Automated Test Coverage

The current test suite covers the critical layers — schema, API route, middleware, session tokens, and the chat input UI — but plenty of newer surface area is still untested. With more time I would add coverage for the Brandee state machine (transition timing, idle escalation, wake-up on activity, transition-frame sequencing), the voice layer (dictation flow, hands-free auto-send, the question-mark heuristic), the conversation-cap modal logic (trim-half vs. clear-all paths), and the TTS greeting latch. Each of these has clear inputs and outputs and would benefit from regression tests as the app keeps evolving.

### 15. More Frequent Feedback Loops with the Team

Most of this project was built heads-down against a tight deadline, which meant I was making product, design, and architectural calls on my own as I went. With more time I would have paused at several checkpoints — early concept, mid-build, and pre-polish — to share progress with the team and gather feedback on the direction. Even a single review session can catch assumptions I didn't realise I was making, surface ideas I wouldn't have thought of, and make sure the final result reflects the team's vision rather than just my interpretation of it.

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
