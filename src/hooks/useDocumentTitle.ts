import { useEffect } from 'react';
import { BRAND } from '../lib/brand';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND.name}` : `${BRAND.name}: can you spot the AI image?`;
  }, [title]);
}
