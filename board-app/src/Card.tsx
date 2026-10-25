import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDate, hostOf, type Card } from './types';

interface Props {
  card: Card;
  editing: boolean;
  selected: boolean;
  imageSrc?: string;
  fallbackSrc?: string;
  onSelect: (id: string) => void;
}

export function CardView({ card, editing, selected, imageSrc, fallbackSrc, onSelect }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: !editing,
  });

  // Sortable transform goes on the slot so it doesn't fight the card's own tilt
  const slotStyle: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const { kind, title, text, image, alt, link, tags, tilt = 0, pinned, added } = card;
  const showTags = tags && tags.length > 0 && kind !== 'quote';

  return (
    <div
      ref={setNodeRef}
      className={`scrap-slot${isDragging ? ' dragging' : ''}${selected ? ' selected' : ''}`}
      style={slotStyle}
      {...(editing ? { ...attributes, ...listeners, onClick: () => onSelect(card.id) } : {})}
    >
      <article
        className={`scrap ${kind}${pinned ? ' pinned' : ''}`}
        style={{ '--tilt': `${tilt}deg` } as CSSProperties}
      >
        {image && (
          <img
            src={imageSrc ?? image}
            alt={alt ?? title ?? ''}
            loading="lazy"
            draggable={false}
            // Newly committed images 404 until the site rebuilds; GitHub raw has them right away
            onError={(e) => {
              if (fallbackSrc && e.currentTarget.src !== fallbackSrc) e.currentTarget.src = fallbackSrc;
            }}
          />
        )}
        {title &&
          (link ? (
            <h2 className="scrap-title">
              <a href={link} target="_blank" rel="noopener">
                {title}
              </a>
            </h2>
          ) : (
            <h2 className="scrap-title">{title}</h2>
          ))}
        {link && <span className="scrap-domain">{hostOf(link)} ↗</span>}
        {text && <p className="scrap-text">{text}</p>}
        {(showTags || added) && (
          <div className="scrap-meta">
            {added && <time dateTime={added}>{formatDate(added)}</time>}
            {showTags &&
              tags.map((t) => (
                <span key={t} className="note-tag">
                  {t}
                </span>
              ))}
          </div>
        )}
      </article>
    </div>
  );
}
