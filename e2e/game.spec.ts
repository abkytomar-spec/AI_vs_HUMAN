import { expect, test, type Page } from '@playwright/test';

async function playRound(page: Page, choice: number) {
  const radios = page.getByRole('radio');
  await expect(radios).toHaveCount(3);
  await page.locator('label').nth(choice).click();
  await page.getByRole('button', { name: 'Lock in answer' }).click();
  await expect(page.getByRole('heading', { name: /You spotted it\.|Not this time/ })).toBeVisible();
}

test('landing page explains the game and starts it', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Can you spot the fake?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'How it works' })).toBeVisible();
  await expect(page.locator('figure img')).toHaveCount(3);
  await page.getByRole('link', { name: 'Play the game' }).click();
  await expect(page).toHaveURL(/\/play\?mode=classic/);
  await expect(page.getByRole('heading', { name: 'Which image is AI-generated?' })).toBeVisible();
});

test('a full game: select, submit, feedback, results, restart', async ({ page }) => {
  await page.goto('./play?mode=warmup');
  for (let round = 1; round <= 5; round++) {
    await expect(page.getByText(`Round ${round} of 5`, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose an image' })).toBeDisabled();
    await playRound(page, round % 3);
    await expect(page.getByRole('heading', { name: 'What gives it away' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Where these images came from' })).toBeVisible();
    await page.getByRole('button', { name: round === 5 ? 'See results' : 'Next round' }).click();
  }
  await expect(page.getByRole('heading', { name: /You spotted \d of 5\./ })).toBeVisible();
  await expect(page.getByText('Final score')).toBeVisible();
  await expect(page.getByText('Best streak')).toBeVisible();
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByText("Round 1 of 5", { exact: true })).toBeVisible();
  await expect(page.getByRole('radio')).toHaveCount(3);
});

test('keyboard-only play', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard shortcuts are a desktop feature');
  await page.goto('./play?mode=expert');
  await expect(page.getByRole('radio')).toHaveCount(3);
  await page.keyboard.press('2');
  await expect(page.getByRole('radio').nth(1)).toBeChecked();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: /You spotted it\.|Not this time/ })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByText("Round 2 of 5", { exact: true })).toBeVisible();
});

test('every image in a round uses the same size and an opaque file name', async ({ page }) => {
  await page.goto('./play?mode=classic');
  const imgs = page.getByRole('radio').locator('xpath=following-sibling::label//img');
  await expect(imgs).toHaveCount(3);
  const info = await imgs.evaluateAll((els) =>
    els.map((el) => {
      const img = el as HTMLImageElement;
      return { src: img.getAttribute('src') ?? '', w: img.naturalWidth, h: img.naturalHeight };
    }),
  );
  for (const i of info) expect(i.src).toMatch(/images\/[0-9a-f]{16}-(480|800)\.jpg$/);
  expect(new Set(info.map((i) => `${i.w}x${i.h}`)).size).toBe(1);
});

test('new games are drawn fresh and avoid images already seen', async ({ page }) => {
  const seenAcrossGames: string[] = [];
  for (let game = 0; game < 2; game++) {
    await page.goto('./play?mode=warmup');
    await expect(page.getByRole('radio')).toHaveCount(3);
    const srcs = await page.locator('fieldset img').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
    seenAcrossGames.push(...(srcs as string[]));
  }
  // Two first rounds from consecutive games should not show the same three images.
  expect(new Set(seenAcrossGames).size).toBeGreaterThan(3);
});

test('image credits and unknown pages', async ({ page }) => {
  await page.goto('./credits');
  await expect(page.getByRole('heading', { name: 'Image credits' })).toBeVisible();
  await expect(page.getByText(/files, listed by file name/)).toBeVisible();
  await page.goto('./does-not-exist');
  await expect(page.getByRole('heading', { name: 'This page does not exist' })).toBeVisible();
});

test('no horizontal scrolling on the game screen', async ({ page }) => {
  await page.goto('./play?mode=classic');
  await expect(page.getByRole('radio')).toHaveCount(3);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
