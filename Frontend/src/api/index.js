import axios from 'axios';

const API = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach access token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
            originalRequest._retry = true;
            try {
                const { data } = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
                const newToken = data.data.accessToken;
                localStorage.setItem('accessToken', newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return API(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => API.post('/auth/register', data),
    login: (data) => API.post('/auth/login', data),
    logout: () => API.post('/auth/logout'),
    getProfile: () => API.get('/auth/profile'),
    updateProfile: (data) => API.put('/auth/profile', data),
    changePassword: (data) => API.put('/auth/change-password', data),
};

// Product API
export const productAPI = {
    getAll: (params) => API.get('/products', { params }),
    getById: (id) => API.get(`/products/${id}`),
    getBySlug: (slug) => API.get(`/products/slug/${slug}`),
    getByCategory: (catId, params) => API.get(`/products/category/${catId}`, { params }),
    create: (data) => API.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    update: (id, data) => API.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id) => API.delete(`/products/${id}`),
    getMyProducts: (params) => API.get('/products/seller/my-products', { params }),
    getBrands: () => API.get('/products/brands'),
};

// Cart API
export const cartAPI = {
    get: () => API.get('/cart'),
    add: (data) => API.post('/cart/add', data),
    update: (data) => API.put('/cart/update', data),
    remove: (itemId) => API.delete(`/cart/item/${itemId}`),
    clear: () => API.delete('/cart/clear'),
};

// Order API
export const orderAPI = {
    create: (data) => API.post('/orders', data),
    getMyOrders: (params) => API.get('/orders', { params }),
    getById: (id) => API.get(`/orders/${id}`),
    cancel: (id, data) => API.put(`/orders/${id}/cancel`, data),
    getSellerOrders: (params) => API.get('/orders/seller/orders', { params }),
    updateItemStatus: (orderId, itemId, data) => API.put(`/orders/${orderId}/items/${itemId}/status`, data),
};

// Review API
export const reviewAPI = {
    getProductReviews: (productId, params) => API.get(`/reviews/product/${productId}`, { params }),
    create: (data) => API.post('/reviews', data),
    update: (id, data) => API.put(`/reviews/${id}`, data),
    delete: (id) => API.delete(`/reviews/${id}`),
};

// Seller API
export const sellerAPI = {
    register: (data) => API.post('/sellers/register', data),
    getProfile: () => API.get('/sellers/me/profile'),
    updateProfile: (data) => API.put('/sellers/me/profile', data),
    getDashboard: () => API.get('/sellers/me/dashboard'),
    getBySlug: (slug) => API.get(`/sellers/store/${slug}`),
    getAll: (params) => API.get('/sellers/all', { params }),
};

// Category API
export const categoryAPI = {
    getAll: () => API.get('/categories'),
};

// OTP API (forgot password flow)
export const otpAPI = {
    generate: (data) => API.post('/otp/generate', data),
    verify: (data) => API.post('/otp/verify', data),
    resend: (data) => API.post('/otp/resend', data),
    resetPassword: (data) => API.post('/otp/reset-password', data),
};

// Admin API
export const adminAPI = {
    getDashboard: () => API.get('/admin/dashboard'),
    getUsers: (params) => API.get('/admin/users', { params }),
    updateUserStatus: (id, data) => API.put(`/admin/users/${id}/status`, data),
    deleteUser: (id) => API.delete(`/admin/users/${id}`),
    createCategory: (data) => API.post('/admin/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    updateCategory: (id, data) => API.put(`/admin/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteCategory: (id) => API.delete(`/admin/categories/${id}`),
    getAllSellers: (params) => API.get('/admin/sellers', { params }),
    updateSellerStatus: (id, data) => API.put(`/admin/sellers/${id}/status`, data),
    deleteSeller: (id) => API.delete(`/admin/sellers/${id}`),
    getAllPayouts: (params) => API.get('/admin/payouts', { params }),
    processPayout: (id, data) => API.put(`/admin/payouts/${id}/process`, data),
    getAllOrders: (params) => API.get('/orders/admin/all', { params }),
    updateOrderStatus: (id, data) => API.put(`/orders/admin/${id}/status`, data),
};
// AI Stylist / Personal Shopper API
export const stylistAPI = {
    chat: (data) => API.post('/stylist/chat', data),
    clearChat: (data) => API.post('/stylist/chat/clear', data),
    recordView: (data) => API.post('/stylist/view', data),
    getRecommendations: (params) => API.get('/stylist/recommendations', { params }),
    getProfile: () => API.get('/stylist/profile'),
};

// Legacy alias for backward compat
export const chatbotAPI = {
    send: (data) => API.post('/stylist/chat', data),
    clear: (data) => API.post('/stylist/chat/clear', data),
};

// Payment API (Stripe)
export const paymentAPI = {
    getConfig: () => API.get('/payments/config'),
    createCheckoutSession: (data) => API.post('/payments/create-checkout-session', data),
    verifySession: (data) => API.post('/payments/verify-session', data),
};


// Visual Search API (CLIP-based)
export const visualSearchAPI = {
    searchByImage: (formData) => API.post('/visual-search', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s timeout for CLIP processing
    }),
    getStatus: () => API.get('/visual-search/status'),
    syncEmbeddings: () => API.post('/visual-search/sync'),
};

// Flash Sales API
export const flashSaleAPI = {
    getActive: () => API.get('/flash-sales/active'),
    getUpcoming: () => API.get('/flash-sales/upcoming'),
    create: (data) => API.post('/flash-sales', data),
    delete: (id) => API.delete(`/flash-sales/${id}`),
};

// Product Comments (Buyer-Seller Chat) API
export const commentAPI = {
    getProductComments: (productId, params) => API.get(`/comments/product/${productId}`, { params }),
    create: (data) => API.post('/comments', data),
    update: (id, data) => API.put(`/comments/${id}`, data),
    delete: (id) => API.delete(`/comments/${id}`),
};

export default API;
