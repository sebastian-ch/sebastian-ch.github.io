import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { Board } from './types';
import './board.css';

const root = document.getElementById('board-root');
if (root) {
  const dataEl = document.getElementById('board-data');
  const initial: Board = JSON.parse(dataEl?.textContent || '{"cards":[]}') ?? { cards: [] };
  createRoot(root).render(
    <App initial={initial} repo={root.dataset.repo ?? ''} branch={root.dataset.branch ?? 'master'} />,
  );
}
