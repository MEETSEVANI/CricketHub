import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const HEALTH_CHECK_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 5_000;

function delay(ms, signal) {
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal.addEventListener('abort', finish, { once: true });
  });
}

export function useApiReadiness() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function checkUntilReady() {
      while (!controller.signal.aborted) {
        const checkController = new AbortController();
        const timeout = setTimeout(() => checkController.abort(), HEALTH_CHECK_TIMEOUT_MS);
        const stopCheck = () => checkController.abort();
        controller.signal.addEventListener('abort', stopCheck, { once: true });

        try {
          const response = await fetch(`${API_URL}/api/health/database`, {
            cache: 'no-store',
            signal: checkController.signal,
          });
          const data = await response.json().catch(() => ({}));
          if (response.ok && data.status === 'ok') {
            setReady(true);
            return;
          }
        } catch {
          // Render can return a temporary loading page while the free service wakes.
        } finally {
          clearTimeout(timeout);
          controller.signal.removeEventListener('abort', stopCheck);
        }

        await delay(RETRY_DELAY_MS, controller.signal);
      }
    }

    checkUntilReady();
    return () => controller.abort();
  }, []);

  return ready;
}
