import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for user
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

/**
 * Generate token for user authentication
 * @param {Object} user - User object from database
 * @returns {string} JWT token
 */
export const generateAuthToken = (user) => {
    return generateToken({
        id: user._id.toString(),
        username: user.username,
        email: user.email
    });
};
