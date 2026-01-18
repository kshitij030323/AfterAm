import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { login as apiLogin, getMe, User } from './lib/api';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { EventForm } from './pages/EventForm';
import { EventBookings } from './pages/EventBookings';
import { Clubs } from './pages/Clubs';
import { ClubForm } from './pages/ClubForm';
import { ClubEvents } from './pages/ClubEvents';
import { Layout } from './components/Layout';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            getMe()
                .then((u) => {
                    if (u.isAdmin) setUser(u);
                    else {
                        localStorage.removeItem('token');
                    }
                })
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        const { user: u, token } = await apiLogin(email, password);
        if (!u.isAdmin) throw new Error('Admin access required');
        localStorage.setItem('token', token);
        setUser(u);
        navigate('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Routes>
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/events" element={<Events />} />
                                    <Route path="/events/new" element={<EventForm />} />
                                    <Route path="/events/:id/edit" element={<EventForm />} />
                                    <Route path="/events/:id/bookings" element={<EventBookings />} />
                                    <Route path="/clubs" element={<Clubs />} />
                                    <Route path="/clubs/new" element={<ClubForm />} />
                                    <Route path="/clubs/:id/edit" element={<ClubForm />} />
                                    <Route path="/clubs/:id/events" element={<ClubEvents />} />
                                </Routes>
                            </Layout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </AuthProvider>
    );
}
