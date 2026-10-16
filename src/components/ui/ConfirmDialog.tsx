import { useEffect, useRef } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Native <dialog>: focus trapping, Escape and inertness come from the platform. */
export function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel = 'Keep playing', onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal?.();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,420px)] rounded-lg border border-line bg-surface p-6 text-ink shadow-[0_24px_48px_-24px_rgb(0_0_0/0.35)]"
    >
      <h2 id="confirm-title" className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      <p id="confirm-body" className="mt-2 text-[15px] leading-relaxed text-ink-2">
        {body}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} autoFocus>
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  );
}
