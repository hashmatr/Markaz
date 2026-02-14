import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { user } = useAuth();
    const [cart, setCart] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (!user) { setCart(null); setCartCount(0); return; }
        try {
            setLoading(true);
            const res = await cartAPI.get();
            const c = res.data.data.cart;
            setCart(c);
            setCartCount(c?.items?.length || 0);
        } catch { setCart(null); setCartCount(0); }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchCart(); }, [fetchCart]);

    const addToCart = async (productId, quantity = 1, size, color) => {
        const res = await cartAPI.add({ productId, quantity, size, color });
        const c = res.data.data.cart;
        setCart(c);
        setCartCount(c?.items?.length || 0);
        return c;
    };

    const updateItem = async (itemId, quantity) => {
        const res = await cartAPI.update({ itemId, quantity });
        const c = res.data.data.cart;
        setCart(c);
        setCartCount(c?.items?.length || 0);
        return c;
    };

    const removeItem = async (itemId) => {
        const res = await cartAPI.remove(itemId);
        const c = res.data.data.cart;
        setCart(c);
        setCartCount(c?.items?.length || 0);
        return c;
    };

    const clearCart = async () => {
        await cartAPI.clear();
        setCart(null);
        setCartCount(0);
    };

    return (
        <CartContext.Provider value={{ cart, cartCount, loading, fetchCart, addToCart, updateItem, removeItem, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};
