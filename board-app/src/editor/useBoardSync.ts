import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GitHubError,
  bytesToBase64,
  commitChanges,
  createBlob,
  headCommit,
  readTextFile,
  utf8ToBase64,
  type Repo,
  type TreeChange,
} from '../github';
import { imageFileName } from '../drop';
import { prepareImage } from '../images';
import { BOARD_PATH, IMAGE_PREFIX, commitMessage, imagesOf, planImages, serializeBoard } from '../sync';
import type { Board, Card } from '../types';

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

// Loads the board from GitHub and saves cards plus staged images as one commit
export function useBoardSync(cfg: Repo, active: boolean) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [status, setStatus] = useState('');
  // Local copies of images: staged ones aren't committed yet, saved ones 404 until Pages rebuilds
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const saved = useRef<Card[]>([]);
  const baseSha = useRef<string | undefined>(undefined);
  const staged = useRef(new Map<string, Blob>());
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const file = await readTextFile(cfg, BOARD_PATH);
      const next = file ? ((JSON.parse(file.text) as Board).cards ?? []) : [];
      saved.current = next;
      baseSha.current = file?.sha;
      setCards(next);
      setDirty(false);
      setConflict(false);
      setLoaded(true);
      setStatus('');
    } catch (err) {
      setStatus(`Could not load board: ${message(err)}`);
    } finally {
      setBusy(false);
    }
  }, [cfg]);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  useEffect(() => () => Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url)), []);

  const update = useCallback((fn: (cards: Card[]) => Card[]) => {
    setCards(fn);
    setDirty(true);
  }, []);

  const stageImage = useCallback(async (file: File): Promise<string> => {
    const { blob, ext } = await prepareImage(file);
    const path = `${IMAGE_PREFIX}${imageFileName(file.name, ext)}`;
    staged.current.set(path, blob);
    setPreviews((p) => ({ ...p, [path]: URL.createObjectURL(blob) }));
    return path;
  }, []);

  const save = useCallback(
    async (force = false): Promise<boolean> => {
      setBusy(true);
      setStatus('Saving…');
      try {
        const head = await headCommit(cfg);
        if (!force) {
          const remote = await readTextFile(cfg, BOARD_PATH, head);
          if (remote?.sha !== baseSha.current) {
            setConflict(true);
            setStatus('The board was changed somewhere else since you loaded it.');
            return false;
          }
        }

        const { upload, remove } = planImages(saved.current, cards, staged.current.keys());
        const changes: TreeChange[] = [];
        for (const path of upload) {
          const bytes = new Uint8Array(await staged.current.get(path)!.arrayBuffer());
          changes.push({ path: path.slice(1), sha: await createBlob(cfg, bytesToBase64(bytes)) });
        }
        const boardSha = await createBlob(cfg, utf8ToBase64(serializeBoard(cards)));
        changes.push({ path: BOARD_PATH, sha: boardSha });
        for (const path of remove) changes.push({ path: path.slice(1), sha: null });

        await commitChanges(cfg, head, changes, commitMessage(upload.length, remove.length));

        saved.current = cards;
        baseSha.current = boardSha;
        staged.current.clear();
        const used = imagesOf(cards);
        const kept: Record<string, string> = {};
        for (const [path, url] of Object.entries(previewsRef.current)) {
          if (used.has(path)) kept[path] = url;
          else URL.revokeObjectURL(url);
        }
        setPreviews(kept);
        setDirty(false);
        setConflict(false);
        setStatus('Saved. The live site updates in about a minute.');
        return true;
      } catch (err) {
        // A 422 on the ref update means another commit landed between our read and write
        if (err instanceof GitHubError && err.status === 422) {
          setConflict(true);
          setStatus('Someone else saved at the same moment.');
        } else {
          setStatus(`Save failed: ${message(err)}`);
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [cfg, cards],
  );

  return { cards, update, loaded, dirty, busy, conflict, status, setStatus, previews, stageImage, save, load };
}
