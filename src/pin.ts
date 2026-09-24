/* A 4-digit lock-screen PIN, kept on this device for each account (only a hash is stored). */

const key = (username: string) => `everlife:pin:v1:${username}`;

async function hash(username: string, pin: string) {
  const bytes = new TextEncoder().encode(`everlife:${username}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const isPin = (pin: string) => /^\d{4}$/.test(pin);

export function hasPin(username: string) {
  try { return !!localStorage.getItem(key(username)); } catch { return false; }
}

export async function checkPin(username: string, pin: string) {
  try { return localStorage.getItem(key(username)) === (await hash(username, pin)); } catch { return false; }
}

export async function savePin(username: string, pin: string) {
  if (!isPin(pin)) return false;
  try { localStorage.setItem(key(username), await hash(username, pin)); return true; } catch { return false; }
}

export function clearPin(username: string) {
  try { localStorage.removeItem(key(username)); } catch { /* nothing stored */ }
}
