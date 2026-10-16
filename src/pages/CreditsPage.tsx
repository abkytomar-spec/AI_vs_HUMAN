import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { SiteHeader } from '../components/layout/SiteHeader';
import { SiteFooter } from '../components/layout/SiteFooter';
import { PageContainer } from '../components/layout/PageContainer';
import { Spinner } from '../components/ui/Spinner';
import { StatusMessage } from '../components/ui/StatusMessage';
import { Button } from '../components/ui/Button';
import { PREVIEW_IMAGES } from '../data/preview';
import { decodePool } from '../lib/poolCodec';
import { PoolSchema, type ImageSource } from '../types/dataset';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ScrollProgress } from '../components/layout/ScrollProgress';

type Row = Pick<ImageSource, 'title' | 'pageUrl' | 'author' | 'license' | 'licenseUrl'>;

/**
 * Attribution for every image in the game. Rows are listed alphabetically with
 * no thumbnails and no origin column, so this page cannot be used as an answer key
 * for a round you are playing. Each round also credits its own images after you answer.
 */
export function CreditsPage() {
  useDocumentTitle('Image credits');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    import('../data/pool.generated')
      .then((m) => PoolSchema.parse(decodePool(m.POOL)))
      .then((pool) => {
        if (cancelled) return;
        const list = pool.images.map(({ source: s }) => ({ title: s.title, pageUrl: s.pageUrl, author: s.author, license: s.license, licenseUrl: s.licenseUrl }));
        list.sort((a, b) => a.title.localeCompare(b.title));
        setRows(list);
      })
      .catch(() => !cancelled && setError('The credits could not be loaded.'));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollProgress />
      <SiteHeader />
      <PageContainer className="flex-1 py-10 sm:py-14">
        <div className="max-w-3xl">
          <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] leading-tight font-semibold tracking-[-0.03em]">Image credits</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
            All images come from Wikimedia Commons. Photographs are used under the Creative Commons licenses chosen by their authors and were cropped, resized and re-encoded for the game. AI-generated images are generally in the public domain or under the license given on their file page. Follow a link to see the original file and its full license.
          </p>

          <h2 className="mt-10 text-[17px] font-semibold">Sample round on the home page</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {PREVIEW_IMAGES.map((img, i) => (
              <li key={img.file} className="py-3 text-[14px] leading-relaxed">
                <p>
                  <span className="font-semibold">{'ABC'[i]}</span>
                  <span className="text-ink-2"> · {img.origin === 'ai' ? 'AI-generated' : 'Photograph'}</span>
                </p>
                <CreditLine row={img.source} />
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-[17px] font-semibold">Images in the game</h2>
          {error ? (
            <StatusMessage className="mt-4" title="Credits unavailable" actions={<Button onClick={() => { setError(null); setAttempt((n) => n + 1); }}>Try again</Button>}>
              {error}
            </StatusMessage>
          ) : rows ? (
            <>
              <p className="mt-1 text-[14px] text-ink-2">{rows.length} files, listed by file name.</p>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {rows.map((row) => (
                  <li key={row.pageUrl} className="py-3 text-[14px] leading-relaxed">
                    <CreditLine row={row} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Spinner className="mt-4" label="Loading credits" />
          )}
        </div>
      </PageContainer>
      <SiteFooter />
    </div>
  );
}

function CreditLine({ row }: { row: Row }) {
  return (
    <p className="text-ink-2">
      <a href={row.pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink">
        {row.title.replace(/^File:/, '')}
        <ExternalLink className="size-3 shrink-0" aria-hidden />
      </a>
      <span> by {row.author}, </span>
      {row.licenseUrl ? (
        <a href={row.licenseUrl} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-2 hover:text-ink">
          {row.license}
        </a>
      ) : (
        <span>{row.license}</span>
      )}
    </p>
  );
}
