const API_URL = import.meta.env.VITE_API_URL || '';

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('crickethub_token');
  const headers = { ...options.headers };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/api${path}`, { ...options, headers });
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
