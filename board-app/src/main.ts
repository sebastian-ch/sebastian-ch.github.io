import { cardMatches } from './filter';

// Viewer entry: the board is rendered by Jekyll; this adds filtering and loads the editor on #edit
const root = document.getElementById('board-root');

if (root) {
  setupFilters(root);

  let editorLoading = false;
  const maybeEdit = async () => {
    if (location.hash !== '#edit' || editorLoading) return;
    editorLoading = true;
    const { mount } = await import('./editor');
    mount(root, { repo: root.dataset.repo ?? '', branch: root.dataset.branch ?? 'master' });
  };
  window.addEventListener('hashchange', maybeEdit);
  maybeEdit();
}

function setupFilters(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>('.garden-search input');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('.tag-btn[data-tag]')];
  const cards = [...root.querySelectorAll<HTMLElement>('.scrap[data-search]')];

  const requested = new URLSearchParams(location.search).get('category');
  let tag = buttons.some((b) => b.dataset.tag === requested) ? requested! : 'all';

  const apply = () => {
    const query = input?.value ?? '';
    for (const card of cards) {
      const tags = (card.dataset.tags ?? '').split(' ').filter(Boolean);
      card.style.display = cardMatches(card.dataset.search ?? '', tags, query, tag) ? '' : 'none';
    }
    for (const b of buttons) b.classList.toggle('active', b.dataset.tag === tag);
  };

  input?.addEventListener('input', apply);
  for (const b of buttons) {
    b.addEventListener('click', () => {
      tag = b.dataset.tag ?? 'all';
      apply();
    });
  }
  apply();
}
