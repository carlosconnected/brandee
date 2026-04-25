import { z } from 'zod';

export const MAX_MESSAGES    = 20;
export const MAX_MSG_CHARS   = 4_000;
export const MAX_TOTAL_CHARS = 16_000;

export const messageSchema = z.object({
  role:    z.enum(['user', 'assistant']),
  content: z.string().min(1).max(MAX_MSG_CHARS),
});

export const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
});

export type ApiMessage  = z.infer<typeof messageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
