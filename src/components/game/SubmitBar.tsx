import { Button } from '../ui/Button';
import { Kbd } from '../ui/Kbd';
import { Spinner } from '../ui/Spinner';

interface SubmitBarProps {
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
}

/** Sticky on phones so the action stays within thumb reach. */
export function SubmitBar({ canSubmit, submitting, onSubmit }: SubmitBarProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-[2px] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
      <div className="flex items-center justify-between gap-4">
        <p className="hidden text-[13px] text-ink-2 sm:flex sm:items-center sm:gap-1.5">
          <Kbd>1</Kbd>
          <Kbd>2</Kbd>
          <Kbd>3</Kbd>
          <span>to choose,</span>
          <Kbd>Enter</Kbd>
          <span>to lock in. Click the corner icon to inspect at full size.</span>
        </p>
        <Button size="lg" className="w-full sm:w-auto sm:min-w-44" disabled={!canSubmit || submitting} onClick={onSubmit} aria-disabled={!canSubmit}>
          {submitting ? <Spinner label="Checking" className="text-white" /> : canSubmit ? 'Lock in answer' : 'Choose an image'}
        </Button>
      </div>
    </div>
  );
}
