import { z } from "zod";

// Server-side hard caps. The client trims history to fit before sending
// (see `useChat.ts`), so well-behaved clients never see a 400 here. The
// limits stay as a safety net against abuse / malformed requests.
export const MAX_MESSAGES = 160;
export const MAX_MSG_CHARS = 2_000;
export const MAX_TOTAL_CHARS = 80_000;
export const MAX_NAME_LENGTH = 50;

export const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(MAX_MSG_CHARS),
});

export const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
  userName: z.string().min(1).max(MAX_NAME_LENGTH).optional(),
});

export type ApiMessage = z.infer<typeof messageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
