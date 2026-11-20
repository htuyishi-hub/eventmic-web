import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TransportProvider } from './context/TransportContext.jsx';
import { SessionProvider } from './context/SessionContext.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { SpeakerPage } from './pages/SpeakerPage.jsx';
import { JoinPage } from './pages/JoinPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const DevGalleryPage = import.meta.env.DEV
  ? React.lazy(() => import('./pages/DevGalleryPage.jsx').then(m => ({ default: m.DevGalleryPage })))
  : null;

export default function App() {
  return (
    <TransportProvider>
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/host" element={<Navigate to="/admin" replace />} />
            <Route path="/speaker" element={<SpeakerPage />} />
            <Route path="/join/:code" element={<JoinPage />} />
            {import.meta.env.DEV && DevGalleryPage && (
              <Route
                path="/dev/gallery"
                element={
                  <React.Suspense fallback={null}>
                    <DevGalleryPage />
                  </React.Suspense>
                }
              />
            )}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </TransportProvider>
  );
}
