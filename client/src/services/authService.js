const API_URL = 'http://localhost:3000/api';

async function registerUser(email, password) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.join(' ') || data.message || 'Registration failed.');
  }

  return data;
}

async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.errors?.join(' ') || data.message || 'Login failed.');
  }

  return data;
}

export {
  registerUser,
  loginUser,
};