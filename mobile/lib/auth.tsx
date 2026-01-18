import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// User type for phone auth
export interface User {
    id?: string;
    phone: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    updateUser: (user: User) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Load user from AsyncStorage on mount
    React.useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('afterhour_current_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.log('Error loading user:', error);
        }
    };

    const updateUser = async (updatedUser: User) => {
        setUser(updatedUser);
        await AsyncStorage.setItem('afterhour_current_user', JSON.stringify(updatedUser));
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['afterhour_current_user', 'afterhour_token']);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, setUser, updateUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

