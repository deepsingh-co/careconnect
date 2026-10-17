import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('cc_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.data.user);
          localStorage.setItem('cc_user', JSON.stringify(res.data.data.user));
        })
        .catch(() => {
          localStorage.removeItem('cc_token');
          localStorage.removeItem('cc_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { user, token } = res.data.data;
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  // WhatsApp OTP auth (children): request code, then verify to sign in/up
  const requestOtp = async (phone) => {
    const res = await api.post('/auth/otp/request', { phone });
    return res.data.data; // { phone, existingUser, demoOtp? }
  };

  const loginWithOtp = async ({ phone, otp, name }) => {
    const res = await api.post('/auth/otp/verify', { phone, otp, name });
    const { user, token } = res.data.data;
    localStorage.setItem('cc_token', token);
    localStorage.setItem('cc_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, requestOtp, loginWithOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
