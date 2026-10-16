import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { GameScreen } from './GameScreen';
import { createStaticRoundService } from '../../services/staticRoundService';
import { makePool } from '../../test/fixtures';
import { mulberry32 } from '../../lib/random';
import { ImageLoadError, preloadRound } from '../../lib/images';

vi.mock('../../lib/images', async (orig) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await orig<typeof import('../../lib/images')>();
  return { ...actual, preloadRound: vi.fn() };
});

describe('missing image assets', () => {
  it('shows a recoverable error and retries the round', async () => {
    const preload = vi.mocked(preloadRound);
    preload.mockRejectedValueOnce(new ImageLoadError('/images/missing-800.jpg')).mockResolvedValue(undefined);
    const service = createStaticRoundService({ loadPool: async () => makePool(6), rng: () => mulberry32(5), seen: () => new Map() });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <GameScreen service={service} mode="classic" onExit={() => undefined} />
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'This round could not load' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findAllByRole('radio')).toHaveLength(3);
  });
});
