import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TransportProvider } from './context/TransportContext.jsx';
import { SessionProvider } from './context/SessionContext.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { SpeakerPage } from './pages/SpeakerPage.jsx';
import { JoinPage } from './pages/JoinPage.jsx';
import { ShareRoomPage } from './pages/ShareRoomPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { SoundCheckPage } from './pages/SoundCheckPage.jsx';
import { DMBootSplash } from './components/brand/DMBootSplash.jsx';

const DevGalleryPage = import.meta.env.DEV
  ? React.lazy(() => import('./pages/DevGalleryPage.jsx').then(m => ({ default: m.DevGalleryPage })))
  : null;

export default function App() {
  useEffect(() => {
    const raw = import.meta.env?.VITE_API_BASE || '/api';
    const base = String(raw).trim().replace(/\/+$/, '').replace(/\/api\/?$/, '') + '/api';
    fetch(`${base}/health`).catch(() => {});
  }, []);

  return (
    <TransportProvider>
      <SessionProvider>
        <DMBootSplash />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/setup" element={<AdminPage />} />
            <Route path="/admin/summary" element={<AdminPage />} />
            <Route path="/admin/speakers" element={<AdminPage />} />
            <Route path="/admin/schedule" element={<AdminPage />} />
            <Route path="/host" element={<Navigate to="/admin" replace />} />
            <Route path="/speaker" element={<SpeakerPage />} />
            <Route path="/check" element={<SoundCheckPage />} />
            <Route path="/join/:code" element={<JoinPage />} />
            <Route path="/join/:code/share" element={<ShareRoomPage />} />
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
