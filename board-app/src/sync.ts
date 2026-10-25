import type { Board, Card } from './types';

export const BOARD_PATH = '_data/board.json';
export const IMAGE_PREFIX = '/assets/garden/';

export function imagesOf(cards: Card[]): Set<string> {
  return new Set(cards.map((c) => c.image).filter((i): i is string => !!i?.startsWith(IMAGE_PREFIX)));
}

// Upload only staged images a card still uses; delete committed images no card uses any more
export function planImages(saved: Card[], current: Card[], staged: Iterable<string>) {
  const used = imagesOf(current);
  return {
    upload: [...staged].filter((p) => used.has(p)),
    remove: [...imagesOf(saved)].filter((p) => !used.has(p)),
  };
}

export function serializeBoard(cards: Card[]): string {
  return JSON.stringify({ cards } satisfies Board, null, 2) + '\n';
}

export function commitMessage(uploaded: number, removed: number): string {
  const parts = ['Update board'];
  if (uploaded) parts.push(`add ${uploaded} image${uploaded === 1 ? '' : 's'}`);
  if (removed) parts.push(`remove ${removed} image${removed === 1 ? '' : 's'}`);
  return parts.join(', ');
}
