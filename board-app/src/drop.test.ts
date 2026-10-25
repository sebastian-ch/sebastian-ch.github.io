import { describe, expect, it } from 'vitest';
import { cardFromText, firstUri, imageFileName } from './drop';
import { base64ToUtf8, bytesToBase64, rawUrl, utf8ToBase64 } from './github';
import { formatDate, today } from './types';

describe('cardFromText', () => {
  it('makes a link card from a bare URL', () => {
    const card = cardFromText(' https://www.example.com/a?b=1 ');
    expect(card).toMatchObject({ kind: 'link', title: 'example.com', link: 'https://www.example.com/a?b=1' });
  });

  it('makes a quote card from quoted text', () => {
    expect(cardFromText('“Maps are arguments.”')).toMatchObject({ kind: 'quote', text: 'Maps are arguments.' });
  });

  it('makes a paper card from other text and ignores blanks', () => {
    expect(cardFromText('see https://x.com later')).toMatchObject({ kind: 'paper' });
    expect(cardFromText('   ')).toBeNull();
  });
});

describe('firstUri', () => {
  it('skips comment lines', () => {
    expect(firstUri('# comment\r\nhttps://a.com\nhttps://b.com')).toBe('https://a.com');
    expect(firstUri('')).toBeUndefined();
  });
});

describe('imageFileName', () => {
  it('slugifies and timestamps', () => {
    expect(imageFileName('My Photo (1).JPG', 'webp', 42)).toBe('42-my-photo-1.webp');
    expect(imageFileName('!!!.png', 'webp', 1)).toBe('1-image.webp');
  });
});

describe('dates', () => {
  it('stamps new cards with today', () => {
    expect(cardFromText('hello')?.added).toBe(today());
  });

  it('formats YYYY-MM-DD without time zone drift', () => {
    expect(today(new Date(2026, 0, 6, 23, 59))).toBe('2026-01-06');
    expect(formatDate('2026-01-06')).toBe('Jan 6, 2026');
    expect(formatDate('garbage')).toBe('garbage');
  });
});

describe('base64', () => {
  it('encodes UTF-8 text', () => {
    expect(utf8ToBase64('café ✓')).toBe(Buffer.from('café ✓').toString('base64'));
  });

  it('round-trips UTF-8 through line-wrapped API base64', () => {
    const wrapped = utf8ToBase64('café ✓ '.repeat(20)).replace(/(.{60})/g, '$1\n');
    expect(base64ToUtf8(wrapped)).toBe('café ✓ '.repeat(20));
  });

  it('builds raw GitHub URLs from site paths', () => {
    expect(rawUrl('a/b', 'master', '/assets/x.webp')).toBe('https://raw.githubusercontent.com/a/b/master/assets/x.webp');
  });

  it('encodes large byte arrays in chunks', () => {
    const bytes = new Uint8Array(100_000).map((_, i) => i % 256);
    expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
  });
});
