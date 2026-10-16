import { ExternalLink } from 'lucide-react';
import type { AnswerVerdict, RevealedImage } from '../../types/game';

const LETTERS = ['A', 'B', 'C'];

/** Curated notes for this exact image set, plus where each image came from. */
export function ExplanationPanel({ verdict }: { verdict: AnswerVerdict }) {
  const ai = verdict.images.find((i) => i.imageId === verdict.aiImageId);
  return (
    <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8">
      <div>
        <h3 className="text-[15px] font-semibold">What gives it away</h3>
        {ai ? <p className="mt-1.5 max-w-prose text-[15px] leading-relaxed text-ink-2">{ai.note}</p> : null}
        {ai && ai.clues.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Clues in this image">
            {ai.clues.map((c) => (
              <li key={c} className="rounded-[5px] bg-canvas px-2 py-1 text-[13px] text-ink-2 ring-1 ring-line">
                {c}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mt-3 max-w-prose text-[13px] leading-relaxed text-ink-3">
          {verdict.noReliableTell
            ? 'There is no dependable visual tell in this round. Appearance alone is often not enough to know where an image came from.'
            : 'Clues like these show up in some AI images, not all, and photographs can have them too.'}
        </p>
      </div>
      <div>
        <h3 className="text-[15px] font-semibold">Where these images came from</h3>
        <ol className="mt-2 divide-y divide-line">
          {verdict.images.map((img, i) => (
            <SourceLine key={img.imageId} letter={LETTERS[i]!} image={img} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function SourceLine({ letter, image }: { letter: string; image: RevealedImage }) {
  const s = image.source;
  const detail = image.origin === 'ai' ? [s.generator, s.date].filter(Boolean).join(', ') : [s.camera, s.date].filter(Boolean).join(', ');
  return (
    <li className="py-2.5 text-[13px] leading-relaxed">
      <p className="text-ink">
        <span className="font-semibold">{letter}</span>
        <span className="text-ink-2"> · {image.origin === 'ai' ? 'AI-generated' : 'Photograph'}</span>
        {detail ? <span className="text-ink-2"> · {detail}</span> : null}
      </p>
      <p className="text-ink-3">
        <a href={s.pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-line-strong underline-offset-2 hover:text-ink">
          {s.author}
          <ExternalLink className="size-3" aria-hidden />
        </a>
        {', '}
        {s.licenseUrl ? (
          <a href={s.licenseUrl} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-ink">
            {s.license}
          </a>
        ) : (
          s.license
        )}
        {image.origin === 'human' ? ', cropped and resized' : ''}
      </p>
      {image.origin === 'human' && image.note ? <p className="mt-0.5 text-ink-2">{image.note}</p> : null}
    </li>
  );
}
