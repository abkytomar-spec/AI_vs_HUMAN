import { Check, Maximize2, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { imageSrc, preferredWidth } from '../../lib/images';
import type { PublicImage } from '../../types/dataset';

export type CardReveal = 'none' | 'ai' | 'human';

export interface ImageCardProps {
  image: PublicImage;
  position: number;
  name: string;
  selected: boolean;
  locked: boolean;
  reveal: CardReveal;
  /** True when this card was the player's pick and the answer is known. */
  pickedResult?: 'correct' | 'wrong';
  onSelect: (position: number) => void;
  onInspect: (position: number) => void;
}

const LETTERS = ['A', 'B', 'C'] as const;

/**
 * One selectable image. Selection uses a native radio input, so arrow keys,
 * screen readers and forms work without custom ARIA. The inspect button sits
 * outside the label so it is a separate control.
 */
export function ImageCard({ image, position, name, selected, locked, reveal, pickedResult, onSelect, onInspect }: ImageCardProps) {
  const letter = LETTERS[position]!;
  const id = `${name}-${position}`;
  const width = preferredWidth();

  return (
    <div
      className={cn(
        'group relative rounded-lg bg-surface p-1.5 transition-[box-shadow,background-color] duration-200 ease-[var(--ease-out-quart)]',
        'has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-accent',
        pickedResult === 'wrong'
          ? 'ring-2 ring-danger'
          : reveal === 'ai'
            ? 'ring-2 ring-ink'
            : selected && reveal === 'none'
              ? 'ring-2 ring-accent'
              : 'ring-1 ring-line',
      )}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={position}
        checked={selected}
        disabled={locked}
        onChange={() => onSelect(position)}
        className="peer sr-only"
        aria-describedby={`${id}-status`}
      />
      <label htmlFor={id} className={cn('block', locked ? 'cursor-default' : 'cursor-pointer')}>
        <span className="relative block aspect-[4/5] overflow-hidden rounded-md bg-line/60">
          <img
            src={imageSrc(image, width)}
            alt={`Image ${letter}: ${image.alt}`}
            width={800}
            height={1000}
            draggable={false}
            decoding="async"
            className={cn(
              'absolute inset-0 size-full object-cover transition-[transform,filter] duration-300 ease-[var(--ease-out-quart)] select-none',
              !locked && 'group-hover:scale-[1.015]',
              reveal === 'human' && 'saturate-[0.85]',
            )}
          />
          {selected && reveal === 'none' ? <SelectionFrame /> : null}
        </span>
        <span className="flex h-11 items-center justify-between gap-2 px-1.5">
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                'inline-flex size-6 items-center justify-center rounded-[5px] text-[13px] font-semibold tabular transition-colors duration-150',
                selected && reveal === 'none' ? 'bg-accent text-white' : 'bg-canvas text-ink-2 ring-1 ring-line',
              )}
            >
              {letter}
            </span>
            <RevealTag reveal={reveal} />
          </span>
          <span id={`${id}-status`} className="text-[13px] text-ink-2">
            {statusText(selected, reveal, pickedResult)}
          </span>
        </span>
      </label>
      <button
        type="button"
        onClick={() => onInspect(position)}
        className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-md bg-surface/90 text-ink opacity-90 ring-1 ring-black/5 transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-has-[input:focus-visible]:opacity-100"
        aria-label={`Inspect image ${letter} at full size`}
      >
        <Maximize2 className="size-4" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}

function statusText(selected: boolean, reveal: CardReveal, picked?: 'correct' | 'wrong') {
  if (picked === 'correct') return 'Your pick, correct';
  if (picked === 'wrong') return 'Your pick';
  if (reveal !== 'none') return '';
  return selected ? 'Your pick' : '';
}

function RevealTag({ reveal }: { reveal: CardReveal }) {
  if (reveal === 'none') return null;
  if (reveal === 'ai') {
    return (
      <span className="inline-flex items-center gap-1 rounded-[5px] bg-ink px-1.5 py-0.5 text-[12px] font-medium text-white">
        <X className="size-3" strokeWidth={2.5} aria-hidden />
        AI-generated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-[5px] bg-success-wash px-1.5 py-0.5 text-[12px] font-medium text-success">
      <Check className="size-3" strokeWidth={2.5} aria-hidden />
      Photograph
    </span>
  );
}

/** Viewfinder corner marks drawn over the selected image. */
function SelectionFrame() {
  const corner = 'absolute size-5 border-white drop-shadow-[0_0_1px_rgb(0_0_0/0.6)]';
  return (
    <span aria-hidden className="pointer-events-none absolute inset-3 motion-safe:animate-[frame-in_180ms_var(--ease-out-quart)]">
      <span className={cn(corner, 'top-0 left-0 border-t-2 border-l-2')} />
      <span className={cn(corner, 'top-0 right-0 border-t-2 border-r-2')} />
      <span className={cn(corner, 'bottom-0 left-0 border-b-2 border-l-2')} />
      <span className={cn(corner, 'right-0 bottom-0 border-r-2 border-b-2')} />
    </span>
  );
}
