# Real or Rendered

**Three images. One is AI-generated. Can you spot it?**

A visual game where you find the AI-generated image among real photographs. Built with React, TypeScript, Vite and Tailwind CSS.

**Play it live:** https://abkytomar-spec.github.io/AI_vs_HUMAN/

**Source:** https://github.com/abkytomar-spec/AI_vs_HUMAN

---

## What it does

- **Landing page:** what the game is, how it works, difficulty levels, scoring, and a sample round.
- **Game:** 3 images per round. Pick the AI image, lock in, and see:
  - the right answer
  - curated notes on what gives this particular image away
  - where all three images came from, with author and license
- **Modes:**
  - Full game: 10 rounds from Warm-up to Blind test
  - Single-level modes: Warm-up, Intermediate, Expert, Blind test (5 rounds each)
- **Results:** score, accuracy, best streak, accuracy by difficulty, a round-by-round strip, your personal best (saved on your device), Play again and Share results.
- **Credits page:** attribution and license for every image.

### No repeats, nothing to game

- **Fresh rounds every game.** Rounds are not stored. Each game draws one AI image plus two real photos of a similar subject from a pool of 132 images (36 AI, 96 photos), using the browser's crypto random generator.
- **Avoids what you've seen.** Your device remembers which images you've seen. New games use unseen images first, then the ones you saw longest ago.
- **Answer position is balanced.** The AI image's position (A, B or C) is evenly spread across a game, and never appears in the same position three times in a row.
- **Files can't give it away.** Every image is cropped to 4:5, resized to the same size (800×1000 and 480×600), re-encoded as JPEG, stripped of metadata, and given a random 16-character name. Format, size, EXIF, file name and URL tell you nothing.
- **Load order can't give it away.** All three images load completely before any is shown.
- **Answers are hidden in the page.** They are encoded in their own bundle chunk, and each round accepts exactly one answer.

**Honest limit:** this is a static site, so the answer key ships with the app. Anyone who reads the source code or this repository can find it. Fully cheat-proof play needs the server mode described below.

### Images

- **Source:** all images come from [Wikimedia Commons](https://commons.wikimedia.org/).
- **Photographs:** uploaded by their photographers, mostly with camera metadata and capture dates going back to 2006.
- **AI images:** uploaded to Commons AI-generated categories, usually with the generator named (DALL-E 2 and 3, Midjourney, Stable Diffusion 3.5, Adobe Firefly, Gemini, Ideogram, StyleGAN, ChatGPT and others).
- **Difficulty:** each AI image was rated by hand.
- **Notes:** each image's notes describe what can actually be seen in it. Where there is no reliable tell, the notes say so.
- **Licenses:** listed in the app and in `dataset/pool.json`.

---

## Run it locally

You need **Node.js 20.19+** (22 recommended) and npm.

```bash
git clone https://github.com/abkytomar-spec/AI_vs_HUMAN.git
cd AI_vs_HUMAN
npm install
npm run dev
```

Open http://localhost:5173. No accounts or API keys are needed.

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Type-check and build the production site into `dist/` |
| `npm run preview` | Serve the production build at http://localhost:4173 |
| `npm test` | Unit and component tests (Vitest + React Testing Library) |
| `npm run test:e2e` | Browser tests (Playwright). Run `npx playwright install chromium` once first, and `npm run build` before |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript in strict mode |
| `node scripts/build-pool.mjs` | Validate `dataset/pool.json` and regenerate `src/data/pool.generated.ts` |

---

## Deploying

This repo deploys itself to **GitHub Pages**. Every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it. In parallel it runs lint, type checks, unit tests and Playwright tests.

The first time on a new copy of the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

To host it anywhere else (Netlify, Vercel, Cloudflare Pages, any static host), run `npm run build` and serve `dist/`. Set `BASE_PATH` if the site lives under a sub-path, for example `BASE_PATH=/my-game/ npm run build`. `dist/404.html` is a copy of the app, so links like `/play` work on refresh.

---

## Optional: server mode with Supabase (cheat-resistant)

By default the game runs fully in the browser. The code also includes a Supabase integration (`src/services/supabaseRoundService.ts`). In that mode the database:

- builds each session
- keeps the answer key private until an answer is recorded
- checks that the image belongs to the round
- accepts one answer per round
- calculates the points

To turn it on:

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. Load the pool into the tables with `dataset/pool.json`.
4. Copy `.env.example` to `.env.local` and fill it in:
   ```
   VITE_DATA_SOURCE=supabase
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Rebuild.

Never put the `service_role` key in a `VITE_` variable. If the variables are missing, the app falls back to browser mode.

> Supabase is **not configured** in the live deployment: no project or credentials were provided. The live site runs in browser mode.

---

## Project structure

```
src/
  app/            App shell, routes, service provider
  pages/          Landing, Play (mode picker + game), Credits, 404
  components/
    layout/       Header, footer, wordmark, page container
    ui/           Button, Kbd, Spinner, status message, confirm dialog
    game/         Game screen, header, image card/grid, inspector, feedback, explanation
    results/      Results summary
  hooks/          useGame (state machine wiring), keyboard shortcuts, count-up
  lib/            Game reducer, scoring, session builder, randomness, storage, sharing, images
  services/       Round services: static (default) and Supabase
  types/          Zod schemas and TypeScript types
  data/           Generated, encoded image pool + home page sample round
  test/           Test setup and fixtures
e2e/              Playwright tests
dataset/          pool.json — the curated image pool (labels, notes, sources, licenses)
public/images/    Normalized images (opaque names)
scripts/          Pool builder, Commons curation tools, post-build step
supabase/         Database schema for server mode
```

### How a game works

The game flow is an explicit state machine (`src/lib/gameReducer.ts`):

```
loading → round-loading → ready → selected → submitting → feedback → (next round | complete)
                     ↘ error (recoverable: retry) ↙
```

- **Guards:** every transition checks the current phase. You can't submit without a selection, submit twice, score a round twice, change a locked answer, or skip a round.
- **Scoring:** lives in `src/lib/scoring.ts`.
  - 100 base points for a correct answer, multiplied by difficulty (×1, ×1.25, ×1.5, ×2).
  - A streak bonus of 10 points per answer in a row, capped at 50.
  - Wrong answers earn 0.
- **Shortcuts:** <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> to choose, <kbd>Enter</kbd> to lock in or continue. The game is fully playable with a keyboard and works with screen readers.

## Credits

Image authors and licenses are listed in the app's **Image credits** page. Icons by [Lucide](https://lucide.dev) (ISC).
