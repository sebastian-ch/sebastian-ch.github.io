import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
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
import { Toolbar } from './Toolbar';
import { TokenPrompt } from './TokenPrompt';
import { useBoardSync } from './useBoardSync';
import { cardFromText, firstUri } from '../drop';
import { canWrite, rawUrl, type Repo } from '../github';
import { newCard, type Card } from '../types';

const TOKEN_KEY = 'board-token';

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

// Reload without the hash to get back to the Jekyll-rendered board
const leaveEditor = () => location.assign(location.pathname + location.search);

type Auth = 'none' | 'checking' | 'ok' | 'rejected';

export function App({ repo, branch }: { repo: string; branch: string }) {
  const [token, setToken] = useState(readToken);
  const [auth, setAuth] = useState<Auth>(token ? 'checking' : 'none');
  const cfg: Repo = useMemo(() => ({ repo, branch, token }), [repo, branch, token]);

  useEffect(() => {
    if (!token) return;
    let current = true;
    setAuth('checking');
    canWrite(cfg).then((ok) => current && setAuth(ok ? 'ok' : 'rejected'));
    return () => {
      current = false;
    };
  }, [cfg, token]);

  if (auth !== 'ok') {
    return (
      <TokenPrompt
        checking={auth === 'checking'}
        rejected={auth === 'rejected'}
        onSubmit={(t) => {
          writeToken(t);
          setToken(t);
        }}
      />
    );
  }

  return (
    <Editor
      cfg={cfg}
      onSignOut={() => {
        writeToken('');
        leaveEditor();
      }}
    />
  );
}

function Editor({ cfg, onSignOut }: { cfg: Repo; onSignOut: () => void }) {
  const board = useBoardSync(cfg, true);
  const { cards, update, stageImage, setStatus } = board;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<{ card: Card; index: number } | null>(null);
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    if (!board.dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [board.dirty]);

  const addCard = useCallback(
    (card: Card) => {
      update((cs) => [card, ...cs]);
      setSelectedId(card.id);
    },
    [update],
  );

  const addImages = useCallback(
    async (files: File[]) => {
      try {
        for (const file of files) {
          const image = await stageImage(file);
          addCard(newCard('polaroid', { image, title: file.name.replace(/\.[^.]+$/, '') }));
        }
      } catch (err) {
        setStatus(`Could not add image: ${(err as Error).message}`);
      }
    },
    [stageImage, addCard, setStatus],
  );

  const addFromTransfer = useCallback(
    (data: DataTransfer) => {
      const images = [...data.files].filter((f) => f.type.startsWith('image/'));
      if (images.length) return void addImages(images);
      const card = cardFromText(firstUri(data.getData('text/uri-list')) ?? data.getData('text/plain'));
      if (card) addCard(card);
    },
    [addImages, addCard],
  );

  // Paste anywhere on the page (outside form fields) to add a card
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select') || !e.clipboardData) return;
      e.preventDefault();
      addFromTransfer(e.clipboardData);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFromTransfer]);

  const save = async (force = false) => {
    if (await board.save(force)) {
      setSelectedId(null);
      setDeleted(null);
    }
  };

  const remove = (id: string) => {
    const index = cards.findIndex((c) => c.id === id);
    if (index === -1) return;
    setDeleted({ card: cards[index], index });
    update((cs) => cs.filter((c) => c.id !== id));
    setSelectedId(null);
  };

  const undoDelete = () => {
    if (!deleted) return;
    update((cs) => [...cs.slice(0, deleted.index), deleted.card, ...cs.slice(deleted.index)]);
    setDeleted(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    update((cs) =>
      arrayMove(
        cs,
        cs.findIndex((c) => c.id === active.id),
        cs.findIndex((c) => c.id === over.id),
      ),
    );
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDropping(false);
    addFromTransfer(e.dataTransfer);
  };

  const selected = cards.find((c) => c.id === selectedId);

  return (
    <>
      <Toolbar
        status={board.status}
        dirty={board.dirty}
        busy={board.busy}
        conflict={board.conflict}
        canUndo={!!deleted}
        onAdd={(kind) => addCard(newCard(kind))}
        onImages={addImages}
        onSave={() => save()}
        onOverwrite={() => save(true)}
        onReload={() => {
          setSelectedId(null);
          setDeleted(null);
          board.load();
        }}
        onUndo={undoDelete}
        onDone={leaveEditor}
        onSignOut={onSignOut}
      />

      <div
        className={`board editing${dropping ? ' dropping' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropping(false);
        }}
        onDrop={onDrop}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={cards.map((c) => c.id)} strategy={rectSortingStrategy}>
            {cards.map((card) => (
              <CardView
                key={card.id}
                card={card}
                selected={card.id === selectedId}
                imageSrc={card.image ? board.previews[card.image] : undefined}
                fallbackSrc={card.image ? rawUrl(cfg.repo, cfg.branch, card.image) : undefined}
                onSelect={setSelectedId}
              />
            ))}
          </SortableContext>
        </DndContext>
        {board.loaded && cards.length === 0 && <p className="no-posts">Drop something here to start.</p>}
        {!board.loaded && <p className="no-posts">Loading the latest board…</p>}
      </div>

      {selected && (
        <CardEditor
          card={selected}
          onChange={(c) => update((cs) => cs.map((x) => (x.id === c.id ? c : x)))}
          onDelete={() => remove(selected.id)}
          onReplaceImage={async (file) => {
            try {
              const image = await stageImage(file);
              update((cs) => cs.map((x) => (x.id === selected.id ? { ...x, image } : x)));
            } catch (err) {
              setStatus(`Could not add image: ${(err as Error).message}`);
            }
          }}
          onClose={() => setSelectedId(null)}
          onSave={() => save()}
          canSave={board.dirty && !board.busy && !board.conflict}
        />
      )}
    </>
  );
}
