import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { RoundService } from '../services/types';
import { createLazyRoundService } from '../services/lazy';

const RoundServiceContext = createContext<RoundService | null>(null);

export function RoundServiceProvider({ children, service }: { children: ReactNode; service?: RoundService }) {
  const value = useMemo(() => service ?? createLazyRoundService(), [service]);
  return <RoundServiceContext.Provider value={value}>{children}</RoundServiceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRoundService(): RoundService {
  const service = useContext(RoundServiceContext);
  if (!service) throw new Error('useRoundService must be used inside RoundServiceProvider');
  return service;
}
