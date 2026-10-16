import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { LandingPage } from '../pages/LandingPage';
import { RoundServiceProvider } from './RoundServiceContext';
import type { RoundService } from '../services/types';

// The game and credits load on demand so the home page stays light.
const PlayPage = lazy(() => import('../pages/PlayPage').then((m) => ({ default: m.PlayPage })));
const CreditsPage = lazy(() => import('../pages/CreditsPage').then((m) => ({ default: m.CreditsPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function PageFallback() {
  return <div className="min-h-dvh" aria-busy="true" />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export function App({ service }: { service?: RoundService }) {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <RoundServiceProvider service={service}>
      <BrowserRouter basename={basename}>
        <AppRoutes />
      </BrowserRouter>
    </RoundServiceProvider>
  );
}
