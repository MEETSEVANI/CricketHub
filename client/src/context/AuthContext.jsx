import { createContext, useContext, useState } from 'react';
import { loginUser } from '../services/authService';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('crickethub_user');

    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('crickethub_token');
  });

  async function login(email, password) {
    const data = await loginUser(email, password);

    localStorage.setItem('crickethub_token', data.token);
    localStorage.setItem('crickethub_user', JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data;
  }

  function logout() {
    localStorage.removeItem('crickethub_token');
    localStorage.removeItem('crickethub_user');

    setToken(null);
    setUser(null);
  }

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

export {
  AuthProvider,
  useAuth,
};