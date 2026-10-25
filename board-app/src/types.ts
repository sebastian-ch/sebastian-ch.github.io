export type CardKind = 'paper' | 'sticky' | 'polaroid' | 'quote' | 'link';

export interface Card {
  id: string;
  kind: CardKind;
  title?: string;
  text?: string;
  image?: string;
  alt?: string;
  link?: string;
  tags?: string[];
  tilt?: number;
  pinned?: boolean;
  /** YYYY-MM-DD the card was added */
  added?: string;
}

export interface Board {
  cards: Card[];
}

export const KINDS: { value: CardKind; label: string }[] = [
  { value: 'paper', label: 'Note' },
  { value: 'sticky', label: 'Sticky' },
  { value: 'quote', label: 'Quote' },
  { value: 'link', label: 'Link' },
  { value: 'polaroid', label: 'Image' },
];

const TILTS = [-2.5, 1.5, -1, 3, -3, 0.5, 2, -1.5];

export function newCard(kind: CardKind, fields: Partial<Card> = {}): Card {
  return {
    id: crypto.randomUUID().slice(0, 8),
    kind,
    tilt: TILTS[Math.floor(Math.random() * TILTS.length)],
    added: today(),
    ...fields,
  };
}

export function today(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Parse as a local date so the day doesn't shift across time zones
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
