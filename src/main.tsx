import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initializeDatabase } from './db';
import './styles.css';

async function start() {
  await initializeDatabase();
  const root = document.getElementById('root');
  if (!root) throw new Error('Application root was not found.');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

start().catch((error) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<main style="font-family:system-ui;padding:3rem;max-width:48rem;margin:auto"><h1>White Horse could not open the local workspace</h1><p>${error instanceof Error ? error.message : 'Unknown startup error'}</p><p>No data was uploaded or changed. Reload the page or restore a verified backup.</p></main>`;
  }
});
