import { newCard, hostOf, type Card } from './types';

const URL_ONLY = /^https?:\/\/\S+$/;
const QUOTED = /^["“](.+)["”]$/s;

// Turns dropped or pasted text into a card: bare URLs become links, "quoted" text becomes a quote
export function cardFromText(raw: string): Card | null {
  const text = raw.trim();
  if (!text) return null;
  if (URL_ONLY.test(text)) return newCard('link', { title: hostOf(text), link: text });
  const quoted = text.match(QUOTED);
  if (quoted) return newCard('quote', { text: quoted[1].trim() });
  return newCard('paper', { text });
}

// text/uri-list allows comment lines starting with '#'
export function firstUri(uriList: string): string | undefined {
  return uriList
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#'));
}

export function imageFileName(original: string, ext: string, now = Date.now()): string {
  const base = original
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${now}-${base || 'image'}.${ext}`;
}
