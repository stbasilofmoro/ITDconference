import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js?v=${__BUILD_ID__}`).catch(() => {});

    // The SW's own `install` precache only knows the shell + fonts (fixed across builds).
    // The hashed JS/CSS bundle this exact page just loaded is only known to the page itself —
    // hand its same-origin resource URLs to the SW so a *first* online visit already leaves
    // enough cached to go offline right after, instead of requiring a second visit.
    navigator.serviceWorker.ready
      .then((registration) => {
        const shellUrl = new URL('index.html', location.href).toString();
        const urls = new Set<string>([shellUrl]);
        for (const entry of performance.getEntriesByType('resource')) {
          try {
            const resourceUrl = new URL(entry.name);
            if (resourceUrl.origin === location.origin) urls.add(resourceUrl.toString());
          } catch {
            // Malformed/opaque entry.name — skip it rather than fail the whole batch.
          }
        }
        registration.active?.postMessage({ type: 'precache', urls: [...urls] });
      })
      .catch(() => {});
  });
}
