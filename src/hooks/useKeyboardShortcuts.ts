import { useEffect, useRef } from 'react';

export interface ShortcutHandlers {
  onSelect?: (position: number) => void;
  onEnter?: () => void;
  enabled?: boolean;
}

const TYPING = 'input:not([type=radio]):not([type=checkbox]), textarea, select, [contenteditable=""], [contenteditable="true"]';

/**
 * 1 / 2 / 3 select an image, Enter submits or continues. Ignored while typing,
 * with modifier keys held, inside open dialogs, and when Enter is pressed on a
 * control that has its own Enter behaviour (buttons and links).
 */
export function useKeyboardShortcuts({ onSelect, onEnter, enabled = true }: ShortcutHandlers) {
  const handlers = useRef({ onSelect, onEnter });
  handlers.current = { onSelect, onEnter };

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(TYPING) || target?.closest('dialog[open]')) return;

      if (event.key === '1' || event.key === '2' || event.key === '3') {
        if (!handlers.current.onSelect) return;
        event.preventDefault();
        handlers.current.onSelect(Number(event.key) - 1);
        return;
      }
      if (event.key === 'Enter') {
        if (!handlers.current.onEnter) return;
        if (target?.closest('button, a[href], summary, [role="button"], [role="link"]')) return;
        event.preventDefault();
        handlers.current.onEnter();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
