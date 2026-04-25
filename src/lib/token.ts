export const COOKIE_NAME = '__brandee_session';

const enc = new TextEncoder();

function encode(str: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(enc.encode(str));
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes  = hex.match(/.{2}/g) ?? [];
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) result[i] = parseInt(bytes[i]!, 16);
  return result;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createToken(secret: string): Promise<string> {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const key   = await importKey(secret);
  const sig   = await crypto.subtle.sign('HMAC', key, encode(nonce));
  return `${nonce}.${toHex(sig)}`;
}

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const nonce  = token.slice(0, dot);
  const sigHex = token.slice(dot + 1);
  try {
    const key = await importKey(secret);
    return await crypto.subtle.verify('HMAC', key, fromHex(sigHex), encode(nonce));
  } catch {
    return false;
  }
}
