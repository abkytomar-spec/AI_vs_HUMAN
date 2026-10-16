/** Placeholder with the exact footprint of the real round, so nothing shifts on load. */
export function RoundSkeleton({ label = 'Loading images' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="min-w-0">
      <span className="sr-only">{label}</span>
      <div className="-mx-4 flex gap-3 overflow-hidden px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 lg:gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-[80%] shrink-0 rounded-lg bg-surface p-1.5 ring-1 ring-line sm:w-auto">
            <div className="aspect-[4/5] animate-pulse rounded-md bg-line/70 motion-reduce:animate-none" />
            <div className="flex h-11 items-center px-1.5">
              <div className="size-6 rounded-[5px] bg-line/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
