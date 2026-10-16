import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { GameScreen } from './GameScreen';
import { createStaticRoundService } from '../../services/staticRoundService';
import { makePool } from '../../test/fixtures';
import { mulberry32 } from '../../lib/random';
import type { RoundService } from '../../services/types';

vi.mock('../../lib/images', async (orig) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await orig<typeof import('../../lib/images')>();
  return { ...actual, preloadRound: vi.fn(() => Promise.resolve()) };
});

const pool = makePool(6);
const aiIds = new Set(pool.images.filter((i) => i.origin === 'ai').map((i) => i.id));

function setup(service: RoundService = createStaticRoundService({ loadPool: async () => pool, rng: () => mulberry32(3), seen: () => new Map() })) {
  const user = userEvent.setup();
  const onExit = vi.fn();
  render(
    <MemoryRouter>
      <GameScreen service={service} mode="warmup" onExit={onExit} />
    </MemoryRouter>,
  );
  return { user, onExit };
}

/** Image ids of the current round, in display order, read from the rendered <img> sources. */
function currentIds(): string[] {
  return screen.getAllByRole('radio').map((radio) => {
    const img = radio.parentElement!.querySelector('img')!;
    return /images\/([0-9a-f]{16})-/.exec(img.getAttribute('src')!)![1]!;
  });
}

describe('GameScreen', () => {
  it('shows three selectable images and blocks submitting until one is chosen', async () => {
    setup();
    const radios = await screen.findAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Choose an image' })).toBeDisabled();
  });

  it('plays a round with the mouse: select, submit, see feedback and the explanation', async () => {
    const { user } = setup();
    await screen.findAllByRole('radio');
    const ids = currentIds();
    const aiPos = ids.findIndex((id) => aiIds.has(id));
    await user.click(screen.getAllByRole('radio')[aiPos]!);
    await user.click(screen.getByRole('button', { name: 'Lock in answer' }));
    expect(await screen.findByRole('heading', { name: 'You spotted it.' })).toBeInTheDocument();
    expect(screen.getByText('+100 points', { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What gives it away' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').every((r) => (r as HTMLInputElement).disabled)).toBe(true);
  });

  it('is playable with the keyboard alone, through to the results', async () => {
    const { user } = setup();
    for (let round = 0; round < 5; round++) {
      await screen.findAllByRole('radio');
      await waitFor(() => expect(screen.getByRole('button', { name: /Choose an image|Lock in answer/ })).toBeInTheDocument());
      const ids = currentIds();
      const wrong = ids.findIndex((id) => !aiIds.has(id));
      await user.keyboard(String(wrong + 1));
      await user.keyboard('{Enter}');
      await screen.findByRole('heading', { name: /Not this time/ });
      await user.keyboard('{Enter}');
    }
    expect(await screen.findByRole('heading', { name: 'You spotted 0 of 5.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play again/ })).toBeInTheDocument();
  });

  it('restarts with a fresh game from the results', async () => {
    const { user } = setup();
    for (let round = 0; round < 5; round++) {
      await screen.findAllByRole('radio');
      await user.keyboard('1');
      await user.keyboard('{Enter}');
      await screen.findByRole('button', { name: /Next round|See results/ });
      await user.keyboard('{Enter}');
    }
    await user.click(await screen.findByRole('button', { name: /Play again/ }));
    await screen.findAllByRole('radio');
    expect(screen.getByText('1', { selector: 'span.font-semibold' })).toBeInTheDocument();
    expect(within(screen.getByText('Score').parentElement!).getAllByText('0').length).toBeGreaterThan(0);
  });

  it('shows a recoverable error when the game cannot start', async () => {
    const failing: RoundService = {
      kind: 'static',
      createSession: vi.fn().mockRejectedValueOnce(new Error('Could not load the images for this game.')).mockImplementation(async (mode) =>
        createStaticRoundService({ loadPool: async () => pool, rng: () => mulberry32(1), seen: () => new Map() }).createSession(mode),
      ),
      submitAnswer: vi.fn(),
    };
    const { user } = setup(failing);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the images for this game.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findAllByRole('radio')).toHaveLength(3);
  });
});
