import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Authentication middleware - verifies JWT token
 * Attaches user object to req.user if valid
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);

        // Get user from database
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.',
            error: error.message
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work for both authenticated and unauthenticated users
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.id).select('-password');

            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};
