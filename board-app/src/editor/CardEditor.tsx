import { KINDS, type Card, type CardKind } from '../types';

interface Props {
  card: Card;
  onChange: (card: Card) => void;
  onDelete: () => void;
  onReplaceImage: (file: File) => void;
  onClose: () => void;
  onSave: () => void;
  canSave: boolean;
}

export function CardEditor({ card, onChange, onDelete, onReplaceImage, onClose, onSave, canSave }: Props) {
  const set = (fields: Partial<Card>) => onChange({ ...card, ...fields });
  const optional = (v: string) => (v === '' ? undefined : v);

  return (
    <aside className="card-editor" aria-label="Edit card">
      <div className="card-editor-head">
        <strong>Edit card</strong>
        <button type="button" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <label>
        Type
        <select value={card.kind} onChange={(e) => set({ kind: e.target.value as CardKind })}>
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Title
        <input value={card.title ?? ''} onChange={(e) => set({ title: optional(e.target.value) })} />
      </label>

      <label>
        Text
        <textarea rows={5} value={card.text ?? ''} onChange={(e) => set({ text: optional(e.target.value) })} />
      </label>

      <label>
        Link
        <input
          type="url"
          placeholder="https://"
          value={card.link ?? ''}
          onChange={(e) => set({ link: optional(e.target.value) })}
        />
      </label>

      <label>
        Image
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onReplaceImage(e.target.files[0])}
        />
      </label>

      {card.image && (
        <>
          <label>
            Image description
            <input value={card.alt ?? ''} onChange={(e) => set({ alt: optional(e.target.value) })} />
          </label>
          <button type="button" className="link-btn" onClick={() => set({ image: undefined, alt: undefined })}>
            Remove image
          </button>
        </>
      )}

      <label>
        Tags <small>(comma separated)</small>
        <input
          value={(card.tags ?? []).join(', ')}
          onChange={(e) => {
            const tags = e.target.value
              .split(',')
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean);
            set({ tags: tags.length ? tags : undefined });
          }}
        />
      </label>

      <label>
        Tilt <small>{card.tilt ?? 0}°</small>
        <input
          type="range"
          min={-6}
          max={6}
          step={0.5}
          value={card.tilt ?? 0}
          onChange={(e) => set({ tilt: Number(e.target.value) })}
        />
      </label>

      <label>
        Date added
        <input type="date" value={card.added ?? ''} onChange={(e) => set({ added: optional(e.target.value) })} />
      </label>

      <label className="check">
        <input type="checkbox" checked={!!card.pinned} onChange={(e) => set({ pinned: e.target.checked || undefined })} />
        Push pin instead of tape
      </label>

      <button type="button" className="tag-btn active save" disabled={!canSave} onClick={onSave}>
        Save board
      </button>

      <button type="button" className="danger" onClick={onDelete}>
        Delete card
      </button>
    </aside>
  );
}
