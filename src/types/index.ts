export type BrandeeState =
  | 'greeting'
  | 'idle'
  | 'bored'
  | 'sleeping'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'celebrating'
  | 'confused';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
