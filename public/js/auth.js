// Authentication utilities for client-side
const AUTH_TOKEN_KEY = 'unimart_auth_token';
const USER_DATA_KEY = 'unimart_user_data';

/**
 * Store authentication token
 */
export function setAuthToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Get authentication token
 */
export function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Remove authentication token
 */
export function removeAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
}

/**
 * Store user data
 */
export function setUserData(user) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

/**
 * Get user data
 */
export function getUserData() {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    return !!getAuthToken();
}

/**
 * Get current user info
 */
export function getCurrentUser() {
    return getUserData();
}

/**
 * Logout user
 */
export function logout() {
    removeAuthToken();
    window.location.href = '/login.html';
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

/**
 * Redirect if already authenticated
 */
export function redirectIfAuthenticated(redirectTo = '/') {
    if (isAuthenticated()) {
        window.location.href = redirectTo;
    }
}
