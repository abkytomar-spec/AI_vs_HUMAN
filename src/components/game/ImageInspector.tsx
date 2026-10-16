import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { imageSrc } from '../../lib/images';
import type { PublicImage } from '../../types/dataset';
import { Button } from '../ui/Button';

interface ImageInspectorProps {
  images: readonly PublicImage[];
  index: number | null;
  canSelect: boolean;
  selected: number | null;
  onSelect: (position: number) => void;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

const LETTERS = ['A', 'B', 'C'];

/** Full-size view for close inspection. Arrow keys switch images; Escape closes. */
export function ImageInspector({ images, index, canSelect, selected, onSelect, onNavigate, onClose }: ImageInspectorProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = index != null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const image = index != null ? images[index] : undefined;
  const go = (delta: number) => index != null && onNavigate((index + delta + images.length) % images.length);

  return (
    <dialog
      ref={ref}
      aria-label={image ? `Image ${LETTERS[index!]} at full size` : 'Image inspector'}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white"
    >
      {image ? (
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            <span className="text-[15px] font-medium">
              Image {LETTERS[index!]} <span className="text-white/60">of 3</span>
            </span>
            <button type="button" onClick={onClose} className="inline-flex size-10 items-center justify-center rounded-md hover:bg-white/10" aria-label="Close">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <img src={imageSrc(image, 800)} alt={image.alt} className="max-h-full max-w-full rounded-md object-contain" width={800} height={1000} />
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 hidden size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:inline-flex"
              aria-label="Previous image"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 hidden size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 sm:inline-flex"
              aria-label="Next image"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
          <div className="flex h-20 shrink-0 items-center justify-center gap-2 px-4">
            <div className="flex gap-1.5 sm:hidden">
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go(-1)} aria-label="Previous image">
                <ChevronLeft className="size-5" aria-hidden />
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => go(1)} aria-label="Next image">
                <ChevronRight className="size-5" aria-hidden />
              </Button>
            </div>
            {canSelect ? (
              <Button
                className="bg-white text-ink hover:bg-white/90"
                onClick={() => {
                  onSelect(index!);
                  onClose();
                }}
              >
                {selected === index ? `Image ${LETTERS[index!]} is your pick` : `Pick image ${LETTERS[index!]}`}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
