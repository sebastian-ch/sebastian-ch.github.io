import { KINDS, type CardKind } from '../types';

interface Props {
  status: string;
  dirty: boolean;
  busy: boolean;
  conflict: boolean;
  canUndo: boolean;
  onAdd: (kind: CardKind) => void;
  onImages: (files: File[]) => void;
  onSave: () => void;
  onOverwrite: () => void;
  onReload: () => void;
  onUndo: () => void;
  onDone: () => void;
  onSignOut: () => void;
}

export function Toolbar(p: Props) {
  const hint = p.dirty ? 'Unsaved changes' : 'Drag to reorder · drop or paste images, links, text';
  return (
    <div className="board-toolbar">
      <span className="board-toolbar-label">Add:</span>
      {KINDS.filter((k) => k.value !== 'polaroid').map((k) => (
        <button key={k.value} type="button" className="tag-btn" onClick={() => p.onAdd(k.value)}>
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
            if (e.target.files) p.onImages([...e.target.files]);
            e.target.value = '';
          }}
        />
      </label>
      <span className="board-toolbar-spacer" />
      <span className="board-status" role="status">
        {p.status || hint}
      </span>
      {p.canUndo && (
        <button type="button" className="tag-btn" onClick={p.onUndo}>
          Undo delete
        </button>
      )}
      {p.conflict ? (
        <>
          <button type="button" className="tag-btn" disabled={p.busy} onClick={p.onReload}>
            Load latest
          </button>
          <button type="button" className="tag-btn active" disabled={p.busy} onClick={p.onOverwrite}>
            Overwrite with mine
          </button>
        </>
      ) : (
        <button type="button" className="tag-btn active" disabled={!p.dirty || p.busy} onClick={p.onSave}>
          Save
        </button>
      )}
      <button type="button" className="tag-btn" onClick={p.onDone}>
        Done
      </button>
      <button type="button" className="tag-btn" onClick={p.onSignOut}>
        Sign out
      </button>
    </div>
  );
}
