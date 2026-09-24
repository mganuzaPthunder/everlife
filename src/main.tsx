import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { listenForClicks } from './sound';

listenForClicks();

// The PIN lock was removed; clear any PIN hashes it left behind on this device.
try {
  for (const k of Object.keys(localStorage)) if (k.startsWith('everlife:pin:')) localStorage.removeItem(k);
} catch { /* storage unavailable */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
