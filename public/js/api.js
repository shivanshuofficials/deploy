// API client with authentication
import { getAuthToken, removeAuthToken } from './auth.js';

const API_BASE_URL = window.location.origin + '/api';

/**
 * Make an authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        // Handle unauthorized - token expired or invalid
        if (response.status === 401) {
            removeAuthToken();
            window.location.href = '/login.html';
            throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Auth API
export const authAPI = {
    signup: (userData) =>
        apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),

    login: (credentials) =>
        apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),

    logout: () =>
        apiRequest('/auth/logout', {
            method: 'POST'
        }),

    getCurrentUser: () =>
        apiRequest('/auth/me')
};

// Products API
export const productsAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/products${queryString ? '?' + queryString : ''}`);
    },

    getById: (id) =>
        apiRequest(`/products/${id}`),

    create: (productData) =>
        apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        }),

    update: (id, productData) =>
        apiRequest(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        }),

    delete: (id) =>
        apiRequest(`/products/${id}`, {
            method: 'DELETE'
        }),

    getMyProducts: () =>
        apiRequest('/products/user/my-products')
};

// Chat API
export const chatAPI = {
    getConversations: () =>
        apiRequest('/chat/conversations'),

    getMessages: (userId, limit = 50) =>
        apiRequest(`/chat/messages/${userId}?limit=${limit}`),

    sendMessage: (receiverId, message) =>
        apiRequest('/chat/messages', {
            method: 'POST',
            body: JSON.stringify({ receiverId, message })
        }),

    markAsRead: (messageId) =>
        apiRequest(`/chat/messages/${messageId}/read`, {
            method: 'PUT'
        }),

    getUnreadCount: () =>
        apiRequest('/chat/unread-count')
};

// Health check
export const healthCheck = () =>
    apiRequest('/health');
