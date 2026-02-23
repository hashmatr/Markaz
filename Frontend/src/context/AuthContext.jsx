import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            // Always fetch fresh profile to get populated addresses
            authAPI.getProfile()
                .then(res => {
                    const u = res.data.data.user;
                    setUser(u);
                    localStorage.setItem('user', JSON.stringify(u));
                })
                .catch(() => {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await authAPI.login({ email, password });
        const { user: u, accessToken } = res.data.data;
        setUser(u);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(u));
        return u;
    };

    const register = async (data) => {
        const res = await authAPI.register(data);
        const { user: u, accessToken } = res.data.data;
        setUser(u);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(u));
        return u;
    };

    const logout = async () => {
        try { await authAPI.logout(); } catch { }
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
