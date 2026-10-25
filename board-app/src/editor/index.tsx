import { createRoot } from 'react-dom/client';
import { App } from './App';
import './editor.css';

// Replaces the Jekyll-rendered board inside `el` with the editor
export function mount(el: HTMLElement, props: { repo: string; branch: string }) {
  createRoot(el).render(<App {...props} />);
}
