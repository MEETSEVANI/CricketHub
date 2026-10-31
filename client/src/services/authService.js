import { apiRequest, sendJson } from './apiClient';

async function registerUser(email, password) {
  return apiRequest('/auth/register', sendJson('POST', { email, password }));
}

async function loginUser(email, password) {
  return apiRequest('/auth/login', sendJson('POST', { email, password }));
}

export {
  registerUser,
  loginUser,
};
