import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'leaflet/dist/leaflet.css';

import App from './App';
import { AppProviders } from './context/AppProviders';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);