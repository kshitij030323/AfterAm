import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Scan } from './pages/Scan';
import { Guestlist } from './pages/Guestlist';
import { EventForm } from './pages/EventForm';
import { Layout } from './components/Layout';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Club {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
}

interface AuthContextType {
  club: Club | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const useApi = () => {
  const { token } = useAuth();

  const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  };

  return { fetchApi, API_URL };
};

function AuthProvider({ children }: { children: ReactNode }) {
  const [club, setClub] = useState<Club | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('scanner_token');
    const savedClub = localStorage.getItem('scanner_club');
    if (savedToken && savedClub) {
      setToken(savedToken);
      setClub(JSON.parse(savedClub));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/scanner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    setClub(data.club);
    setToken(data.token);
    localStorage.setItem('scanner_token', data.token);
    localStorage.setItem('scanner_club', JSON.stringify(data.club));
  };

  const logout = () => {
    setClub(null);
    setToken(null);
    localStorage.removeItem('scanner_token');
    localStorage.removeItem('scanner_club');
  };

  return (
    <AuthContext.Provider value={{ club, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { club, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!club) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/scan" element={<Scan />} />
                  <Route path="/events/new" element={<EventForm />} />
                  <Route path="/events/:id/edit" element={<EventForm />} />
                  <Route path="/events/:eventId/guestlist" element={<Guestlist />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
