import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are Brandee, a friendly, warm, and energetic AI assistant. \
You have an upbeat, conversational personality and genuinely enjoy helping people. \
Keep your responses concise, clear, and engaging — usually 2-4 sentences unless the user needs more detail.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages is required' }, { status: 400 });
    }

    // Deliberate delay so the "thinking" animation is visible even on fast responses
    await new Promise((r) => setTimeout(r, 300));

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[/api/chat]', error);
    return NextResponse.json({ error: 'Failed to get response from Groq.' }, { status: 500 });
  }
}
