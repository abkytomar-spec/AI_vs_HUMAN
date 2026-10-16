import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function Harness(props: { onSelect: (n: number) => void; onEnter: () => void }) {
  useKeyboardShortcuts(props);
  return (
    <div>
      <input aria-label="name" />
      <button type="button">A button</button>
    </div>
  );
}

describe('useKeyboardShortcuts', () => {
  it('maps 1, 2, 3 to positions and Enter to the main action', async () => {
    const onSelect = vi.fn();
    const onEnter = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSelect={onSelect} onEnter={onEnter} />);
    await user.keyboard('2');
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(1);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('ignores keys while typing and Enter on buttons', async () => {
    const onSelect = vi.fn();
    const onEnter = vi.fn();
    const user = userEvent.setup();
    const { getByLabelText, getByRole } = render(<Harness onSelect={onSelect} onEnter={onEnter} />);
    await user.click(getByLabelText('name'));
    await user.keyboard('3{Enter}');
    getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onEnter).not.toHaveBeenCalled();
  });

  it('ignores shortcuts with modifier keys', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSelect={onSelect} onEnter={() => undefined} />);
    await user.keyboard('{Control>}1{/Control}');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
