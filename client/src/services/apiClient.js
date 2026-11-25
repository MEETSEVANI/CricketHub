const API_URL = import.meta.env.VITE_API_URL || '';
const REQUEST_TIMEOUT_MS = 90_000;

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('crickethub_token');
  const headers = { ...options.headers };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The server is taking too long to respond. Please try again in a moment.', { cause: error });
    }
    throw new Error('Could not reach the CricketHub server. It may be starting up; please try again shortly.', { cause: error });
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.errors?.join(' ') || data.message || 'The request could not be completed.');
  }
  return data;
}

function sendJson(method, body) {
  return { method, body: JSON.stringify(body) };
}

export { apiRequest, sendJson };
