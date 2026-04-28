import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { chatRequestSchema, MAX_TOTAL_CHARS } from '@/lib/schema';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BASE_SYSTEM_PROMPT = `You are Brandee, a friendly, warm, and energetic AI assistant. \
You have an upbeat, conversational personality and genuinely enjoy helping people. \
Keep your responses concise, clear, and engaging — usually 2-4 sentences unless the user needs more detail.`;

function buildSystemPrompt(userName?: string): string {
  if (!userName) return BASE_SYSTEM_PROMPT;
  // Sanitize: strip line breaks so a malicious name can't escape into a new instruction line.
  const safeName = userName.replace(/[\n\r]/g, '').trim().slice(0, 50);
  if (!safeName) return BASE_SYSTEM_PROMPT;
  return `${BASE_SYSTEM_PROMPT}\n\nThe user's name is "${safeName}". Address them by name occasionally to keep the conversation personal — but don't overdo it.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid request.' },
        { status: 400 }
      );
    }

    const { messages, userName } = parsed.data;

    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) {
      return NextResponse.json({ error: 'Message history is too long.' }, { status: 400 });
    }

    // Deliberate delay so the "thinking" animation is visible even on fast responses
    await new Promise((r) => setTimeout(r, 300));

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: buildSystemPrompt(userName) }, ...messages],
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply =
      completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[/api/chat]', error);
    return NextResponse.json({ error: 'Failed to get response from Groq.' }, { status: 500 });
  }
}
