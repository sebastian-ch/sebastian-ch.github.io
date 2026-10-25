import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CardView } from './Card';
import { CardEditor } from './CardEditor';
import { cardFromText, firstUri, imageFileName } from './drop';
import { bytesToBase64, canPush, getTextFile, putFile, rawUrl, utf8ToBase64, type Repo } from './github';
import { prepareImage } from './images';
import { KINDS, newCard, type Board, type Card, type CardKind } from './types';

const BOARD_PATH = '_data/board.json';
const IMAGE_DIR = 'assets/garden';
const TOKEN_KEY = 'board-token';

interface Props {
  initial: Board;
  repo: string;
  branch: string;
}

function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable; token lasts for this visit only
  }
}

export function App({ initial, repo, branch }: Props) {
  const [cards, setCards] = useState<Card[]>(initial.cards ?? []);
  const [editing, setEditing] = useState(() => location.hash === '#edit');
  const [token, setToken] = useState(readToken);
  const [authed, setAuthed] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState(() => new URLSearchParams(location.search).get('category') ?? 'all');
  const [dropping, setDropping] = useState(false);
  // Images uploaded this session aren't on the live site until Pages rebuilds, so show local copies
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const boardSha = useRef<string | undefined>(undefined);

  const cfg: Repo = useMemo(() => ({ repo, branch, token }), [repo, branch, token]);
  const canEdit = editing && authed;

  useEffect(() => {
    const onHash = () => setEditing(location.hash === '#edit');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!editing || !token || authed) return;
    canPush(cfg).then((ok) => {
      if (ok) setAuthed(true);
      else setStatus('That token cannot push to the repo.');
    });
  }, [editing, token, authed, cfg]);

  // The page's embedded board lags behind GitHub (local server, Pages rebuild), so edit the latest copy
  useEffect(() => {
    if (!authed) return;
    getTextFile(cfg, BOARD_PATH)
      .then((file) => {
        if (!file) return;
        boardSha.current = file.sha;
        setCards((JSON.parse(file.text) as Board).cards ?? []);
        setDirty(false);
      })
      .catch((err) => setStatus(`Could not load latest board: ${(err as Error).message}`));
  }, [authed, cfg]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = useCallback((next: (cards: Card[]) => Card[]) => {
    setCards(next);
    setDirty(true);
  }, []);

  const addCard = useCallback(
    (card: Card) => {
      update((cs) => [card, ...cs]);
      setSelectedId(card.id);
    },
    [update],
  );

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      setStatus(`Uploading ${file.name}…`);
      const { blob, ext } = await prepareImage(file);
      const name = imageFileName(file.name, ext);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      await putFile(cfg, `${IMAGE_DIR}/${name}`, bytesToBase64(bytes), `Add board image ${name}`);
      const path = `/${IMAGE_DIR}/${name}`;
      setPreviews((p) => ({ ...p, [path]: URL.createObjectURL(blob) }));
      setStatus('Image uploaded. Remember to save.');
      return path;
    },
    [cfg],
  );

  const addImages = useCallback(
    async (files: File[]) => {
      setBusy(true);
      try {
        for (const file of files) {
          const image = await uploadImage(file);
          addCard(newCard('polaroid', { image, title: file.name.replace(/\.[^.]+$/, '') }));
        }
      } catch (err) {
        setStatus(`Upload failed: ${(err as Error).message}`);
      } finally {
        setBusy(false);
      }
    },
    [uploadImage, addCard],
  );

  const addFromTransfer = useCallback(
    (data: DataTransfer) => {
      const images = [...data.files].filter((f) => f.type.startsWith('image/'));
      if (images.length) return void addImages(images);
      const text = firstUri(data.getData('text/uri-list')) ?? data.getData('text/plain');
      const card = cardFromText(text);
      if (card) addCard(card);
    },
    [addImages, addCard],
  );

  // Paste anywhere on the page (outside form fields) to add a card
  useEffect(() => {
    if (!canEdit) return;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select') || !e.clipboardData) return;
      e.preventDefault();
      addFromTransfer(e.clipboardData);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [canEdit, addFromTransfer]);

  const save = async () => {
    setBusy(true);
    setStatus('Saving…');
    try {
      const json = JSON.stringify({ cards } satisfies Board, null, 2) + '\n';
      boardSha.current = await putFile(cfg, BOARD_PATH, utf8ToBase64(json), 'Update board', boardSha.current);
      setDirty(false);
      setStatus('Saved. The live site updates in about a minute.');
    } catch (err) {
      boardSha.current = undefined;
      setStatus(`Save failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    update((cs) => {
      const from = cs.findIndex((c) => c.id === active.id);
      const to = cs.findIndex((c) => c.id === over.id);
      return arrayMove(cs, from, to);
    });
  };

  const onFileDrop = (e: DragEvent) => {
    if (!canEdit) return;
    e.preventDefault();
    setDropping(false);
    addFromTransfer(e.dataTransfer);
  };

  const allTags = useMemo(() => [...new Set(cards.flatMap((c) => c.tags ?? []))].sort(), [cards]);

  // Filtering is off while editing so drag order always matches the saved order
  const visible = canEdit
    ? cards
    : cards.filter((c) => {
        const haystack = [c.title, c.text, c.link, ...(c.tags ?? [])].join(' ').toLowerCase();
        return (tag === 'all' || c.tags?.includes(tag)) && haystack.includes(query.toLowerCase());
      });

  const selected = cards.find((c) => c.id === selectedId);

  if (editing && !authed) {
    return (
      <TokenPrompt
        status={status}
        onSubmit={(t) => {
          setStatus('');
          writeToken(t);
          setToken(t);
        }}
      />
    );
  }

  return (
    <>
      {canEdit ? (
        <div className="board-toolbar">
          <span className="board-toolbar-label">Add:</span>
          {KINDS.filter((k) => k.value !== 'polaroid').map((k) => (
            <button key={k.value} type="button" className="tag-btn" onClick={() => addCard(newCard(k.value as CardKind))}>
              {k.label}
            </button>
          ))}
          <label className="tag-btn">
            Image
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) addImages([...e.target.files]);
                e.target.value = '';
              }}
            />
          </label>
          <span className="board-toolbar-spacer" />
          <span className="board-status" role="status">
            {status || (dirty ? 'Unsaved changes' : 'Drag to reorder · drop or paste images, links, text')}
          </span>
          <button type="button" className="tag-btn active" disabled={!dirty || busy} onClick={save}>
            Save
          </button>
          <button
            type="button"
            className="tag-btn"
            onClick={() => {
              writeToken('');
              setToken('');
              setAuthed(false);
              location.hash = '';
            }}
          >
            Sign out
          </button>
        </div>
      ) : (
        <>
          <div className="garden-search">
            <input type="text" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {allTags.length > 0 && (
            <div className="tags-filter">
              <span className="tags-label">Filter by tag:</span>
              {['all', ...allTags].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tag-btn${tag === t ? ' active' : ''}`}
                  onClick={() => setTag(t)}
                >
                  {t === 'all' ? 'All' : t}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div
        className={`board${canEdit ? ' editing' : ''}${dropping ? ' dropping' : ''}`}
        onDragOver={(e) => {
          if (!canEdit) return;
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropping(false);
        }}
        onDrop={onFileDrop}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visible.map((c) => c.id)} strategy={rectSortingStrategy}>
            {visible.map((card) => (
              <CardView
                key={card.id}
                card={card}
                editing={canEdit}
                selected={card.id === selectedId}
                imageSrc={card.image ? previews[card.image] : undefined}
                fallbackSrc={card.image ? rawUrl(repo, branch, card.image) : undefined}
                onSelect={setSelectedId}
              />
            ))}
          </SortableContext>
        </DndContext>
        {visible.length === 0 && (
          <p className="no-posts">{canEdit ? 'Drop something here to start.' : 'Nothing here yet.'}</p>
        )}
      </div>

      {canEdit && selected && (
        <CardEditor
          card={selected}
          onChange={(c) => update((cs) => cs.map((x) => (x.id === c.id ? c : x)))}
          onDelete={() => {
            update((cs) => cs.filter((x) => x.id !== selected.id));
            setSelectedId(null);
          }}
          onReplaceImage={async (file) => {
            setBusy(true);
            try {
              const image = await uploadImage(file);
              update((cs) => cs.map((x) => (x.id === selected.id ? { ...x, image } : x)));
            } catch (err) {
              setStatus(`Upload failed: ${(err as Error).message}`);
            } finally {
              setBusy(false);
            }
          }}
          onClose={() => setSelectedId(null)}
          onSave={save}
          canSave={dirty && !busy}
        />
      )}
    </>
  );
}

function TokenPrompt({ status, onSubmit }: { status: string; onSubmit: (token: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      className="token-prompt"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <p>
        Paste a GitHub fine-grained token with <strong>Contents: read and write</strong> on this repo. It's stored
        only in this browser.
      </p>
      <input type="password" value={value} onChange={(e) => setValue(e.target.value)} placeholder="github_pat_…" />
      <button type="submit" className="tag-btn active">
        Edit board
      </button>
      {status && <p className="board-status">{status}</p>}
    </form>
  );
}
