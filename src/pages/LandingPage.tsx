import { ArrowRight } from 'lucide-react';
import { SiteHeader } from '../components/layout/SiteHeader';
import { SiteFooter } from '../components/layout/SiteFooter';
import { PageContainer } from '../components/layout/PageContainer';
import { ButtonLink } from '../components/ui/Button';
import { DifficultyBadge } from '../components/game/GameHeader';
import { DIFFICULTY_DESCRIPTION, MODES } from '../lib/modes';
import { SCORING, basePointsFor } from '../lib/scoring';
import { PREVIEW_IMAGES } from '../data/preview';
import { DIFFICULTIES } from '../types/constants';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useReveal } from '../hooks/useReveal';
import { ScrollProgress } from '../components/layout/ScrollProgress';
import type { Difficulty } from '../types/constants';

const BASE = import.meta.env.BASE_URL;

export function LandingPage() {
  useDocumentTitle();
  const classicRounds = MODES.classic.plan.reduce((n, p) => n + p.count, 0);

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollProgress />
      <SiteHeader />
      <PageContainer className="flex-1">
        <section className="grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14 lg:py-20" aria-labelledby="hero-title">
          <div className="max-w-xl">
            <h1 id="hero-title" className="text-[clamp(2.5rem,6.2vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">
              Can you spot the fake?
            </h1>
            <p className="mt-5 max-w-md text-[18px] leading-relaxed text-ink-2">
              Each round shows three images. Two are real photographs, one was made by an AI image generator. Find it.
            </p>
            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <ButtonLink to="/play?mode=classic" size="lg">
                Play the game
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <a href="#how-it-works" className="inline-flex h-12 items-center justify-center rounded-md border border-line-strong bg-surface px-5 text-base font-medium text-ink transition-colors duration-150 hover:border-ink/40">
                How it works
              </a>
            </div>
            <p className="mt-4 text-[14px] text-ink-2">
              {classicRounds} rounds, about five minutes. No sign-up.
            </p>
          </div>
          <HeroPreview />
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-t border-line py-14 sm:py-20" aria-labelledby="how-title">
          <h2 {...useReveal<HTMLHeadingElement>()} id="how-title" className="text-[clamp(1.6rem,3.4vw,2.25rem)] leading-tight font-semibold tracking-[-0.03em]">
            How it works
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            <Step n={1} delay={0} title="Look closely">
              Three images share a subject and a look. Open any of them at full size to check the details.
            </Step>
            <Step n={2} delay={90} title="Pick the AI image">
              Choose the one you think was generated and lock in your answer. Use the 1, 2 and 3 keys if you prefer.
            </Step>
            <Step n={3} delay={180} title="See what gave it away">
              Each answer comes with notes on that image and where all three came from, so you get better as you play.
            </Step>
          </ol>
        </section>

        <section className="grid gap-10 border-t border-line py-14 sm:py-20 lg:grid-cols-2 lg:gap-16" aria-labelledby="difficulty-title">
          <div {...useReveal<HTMLDivElement>()}>
            <h2 id="difficulty-title" className="text-[clamp(1.6rem,3.4vw,2.25rem)] leading-tight font-semibold tracking-[-0.03em]">
              Four levels of difficulty
            </h2>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-ink-2">
              Difficulty comes from the images, not from timers. Each AI image was rated by hand for how hard it is to spot.
            </p>
            <ul className="mt-8 grid gap-5">
              {DIFFICULTIES.map((d, i) => (
                <DifficultyRow key={d} difficulty={d} delay={i * 80} />
              ))}
            </ul>
          </div>
          <div {...useReveal<HTMLDivElement>(120)}>
            <h2 className="text-[clamp(1.6rem,3.4vw,2.25rem)] leading-tight font-semibold tracking-[-0.03em]">Scoring</h2>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-ink-2">
              A correct answer earns {SCORING.basePoints} points, scaled by difficulty. Answers in a row add a streak bonus of {SCORING.streakBonusStep} points each, up to {SCORING.maxStreakBonus}. A wrong answer earns nothing and resets the streak.
            </p>
            <table className="mt-8 w-full max-w-md text-left text-[15px]">
              <caption className="sr-only">Points for a correct answer by difficulty</caption>
              <thead>
                <tr className="border-b border-line text-[13px] text-ink-2">
                  <th scope="col" className="py-2 font-medium">Difficulty</th>
                  <th scope="col" className="py-2 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {DIFFICULTIES.map((d) => (
                  <tr key={d} className="border-b border-line">
                    <td className="py-2.5">
                      <DifficultyBadge difficulty={d} />
                    </td>
                    <td className="py-2.5 text-right font-medium tabular">{basePointsFor(d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t border-line py-14 sm:py-20" aria-labelledby="images-title">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
            <h2 {...useReveal<HTMLHeadingElement>()} id="images-title" className="text-[clamp(1.6rem,3.4vw,2.25rem)] leading-tight font-semibold tracking-[-0.03em]">
              About the images
            </h2>
            <div {...useReveal<HTMLDivElement>(100)} className="grid max-w-2xl gap-4 text-[17px] leading-relaxed text-ink-2">
              <p>
                Every image comes from Wikimedia Commons under an open license. The photographs were taken with cameras by Commons contributors. The AI images were uploaded and labeled as AI-generated by the people who made them, usually with the generator named.
              </p>
              <p>
                All images are cropped to the same shape, resized to the same dimensions, stripped of metadata and given random file names, so the answer cannot be read from the file. Games are put together fresh each time.
              </p>
              <p>
                Spotting a fake by eye is a skill, not proof. Some AI images in the harder levels have no reliable visual tell, and the notes say so when that is the case.
              </p>
            </div>
          </div>
        </section>
      </PageContainer>
      <SiteFooter />
    </div>
  );
}

function Step({ n, delay, title, children }: { n: number; delay: number; title: string; children: React.ReactNode }) {
  return (
    <li {...useReveal<HTMLLIElement>(delay)} className="grid content-start gap-2">
      <span aria-hidden className="inline-flex size-7 items-center justify-center rounded-md bg-ink text-[13px] font-semibold text-white tabular">
        {n}
      </span>
      <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
      <p className="max-w-sm text-[15px] leading-relaxed text-ink-2">{children}</p>
    </li>
  );
}

function DifficultyRow({ difficulty, delay }: { difficulty: Difficulty; delay: number }) {
  return (
    <li {...useReveal<HTMLLIElement>(delay)} className="grid gap-1">
      <DifficultyBadge difficulty={difficulty} />
      <p className="max-w-md text-[15px] leading-relaxed text-ink-2">{DIFFICULTY_DESCRIPTION[difficulty]}</p>
    </li>
  );
}

/** A real round that is never used in the game, so showing it gives nothing away. */
function HeroPreview() {
  return (
    <figure className="min-w-0">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {PREVIEW_IMAGES.map((img, i) => (
          <div
            key={img.file}
            className="rounded-lg bg-surface p-1 ring-1 ring-line sm:p-1.5"
            style={{ animation: `frame-in 620ms var(--ease-out-quart) ${i * 110}ms both` }}
          >
            <img
              src={`${BASE}images/${img.file}`}
              alt={`Preview image ${'ABC'[i]}: ${img.alt}`}
              width={480}
              height={600}
              className="aspect-[4/5] w-full rounded-md object-cover"
              fetchPriority={i === 0 ? 'high' : 'auto'}
            />
            <span className="flex h-8 items-center px-1 text-[13px] font-semibold text-ink-2 sm:h-9">{'ABC'[i]}</span>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-[14px] text-ink-2">
        One of these was generated by AI. This sample is not part of the game, and its answer is on the credits page.
      </figcaption>
    </figure>
  );
}
