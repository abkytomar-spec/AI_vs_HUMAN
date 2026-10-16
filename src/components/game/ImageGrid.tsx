import type { SessionRound } from '../../types/game';
import { ImageCard, type CardReveal } from './ImageCard';

interface ImageGridProps {
  round: SessionRound;
  selection: number | null;
  locked: boolean;
  /** Known once the answer is revealed. */
  aiImageId: string | null;
  onSelect: (position: number) => void;
  onInspect: (position: number) => void;
}

/**
 * Desktop and tablet: three equal columns. Phones: a horizontal snap carousel
 * with large cards, so images stay big enough to inspect.
 */
export function ImageGrid({ round, selection, locked, aiImageId, onSelect, onInspect }: ImageGridProps) {
  const name = `pick-${round.round.id}`;
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">Choose the AI-generated image</legend>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:gap-5 [&::-webkit-scrollbar]:hidden">
        {round.images.map((image, position) => {
          const reveal: CardReveal = aiImageId == null ? 'none' : image.id === aiImageId ? 'ai' : 'human';
          const picked = aiImageId != null && selection === position ? (image.id === aiImageId ? 'correct' : 'wrong') : undefined;
          return (
            <div key={image.id} className="w-[80%] shrink-0 snap-center sm:w-auto">
              <ImageCard
                image={image}
                position={position}
                name={name}
                selected={selection === position}
                locked={locked}
                reveal={reveal}
                pickedResult={picked}
                onSelect={onSelect}
                onInspect={onInspect}
              />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
