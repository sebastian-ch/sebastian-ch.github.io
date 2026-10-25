import { describe, expect, it } from 'vitest';
import { commitMessage, imagesOf, planImages, serializeBoard } from './sync';
import { cardMatches } from './filter';
import type { Card } from './types';

const card = (id: string, image?: string): Card => ({ id, kind: 'polaroid', image });

describe('planImages', () => {
  it('uploads staged images still in use and skips ones whose card was removed', () => {
    const current = [card('a', '/assets/garden/new.webp')];
    const plan = planImages([], current, ['/assets/garden/new.webp', '/assets/garden/dropped.webp']);
    expect(plan.upload).toEqual(['/assets/garden/new.webp']);
  });

  it('removes committed images no card uses, keeping shared ones', () => {
    const saved = [card('a', '/assets/garden/x.webp'), card('b', '/assets/garden/y.webp'), card('c', '/assets/garden/y.webp')];
    const current = [card('c', '/assets/garden/y.webp')];
    expect(planImages(saved, current, []).remove).toEqual(['/assets/garden/x.webp']);
  });

  it('never deletes images outside the board image folder', () => {
    expect(imagesOf([card('a', 'https://example.com/a.png'), card('b', '/pics/me.jpg')]).size).toBe(0);
  });
});

describe('serializeBoard / commitMessage', () => {
  it('writes stable pretty JSON with a trailing newline', () => {
    expect(serializeBoard([{ id: 'a', kind: 'paper' }])).toBe('{\n  "cards": [\n    {\n      "id": "a",\n      "kind": "paper"\n    }\n  ]\n}\n');
  });

  it('describes image changes', () => {
    expect(commitMessage(0, 0)).toBe('Update board');
    expect(commitMessage(2, 1)).toBe('Update board, add 2 images, remove 1 image');
  });
});

describe('cardMatches', () => {
  it('filters by tag and case-insensitive search', () => {
    expect(cardMatches('Esri Maps', ['code'], ' maps ', 'all')).toBe(true);
    expect(cardMatches('Esri Maps', ['code'], '', 'geography')).toBe(false);
    expect(cardMatches('Esri Maps', ['code'], 'esri', 'code')).toBe(true);
  });
});
