import express from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { search, limit = 50, page = 1 } = req.query;

        let query = {};

        // Text search if search parameter provided
        if (search) {
            query.$text = { $search: search };
        }

        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('seller', 'username email')
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Private
 */
router.post('/', authenticate, [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ max: 100 })
        .withMessage('Title cannot exceed 100 characters'),
    body('price')
        .isNumeric()
        .withMessage('Price must be a number')
        .custom(value => value >= 0)
        .withMessage('Price cannot be negative'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),
    body('image_url')
        .optional()
        .trim()
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { title, description, price, image_url } = req.body;

        const product = new Product({
            title,
            description,
            price,
            image_url: image_url || 'https://via.placeholder.com/300',
            seller: req.user._id,
            seller_name: req.user.username
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully!',
            product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Private (owner only)
 */
router.put('/:id', authenticate, [
    body('title')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Title cannot exceed 100 characters'),
    body('price')
        .optional()
        .isNumeric()
        .withMessage('Price must be a number')
        .custom(value => value >= 0)
        .withMessage('Price cannot be negative'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check ownership
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this product'
            });
        }

        // Update fields
        const { title, description, price, image_url } = req.body;
        if (title) product.title = title;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = price;
        if (image_url) product.image_url = image_url;

        await product.save();

        res.json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Private (owner only)
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check ownership
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product'
            });
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/products/user/my-products
 * @desc    Get current user's products
 * @access  Private
 */
router.get('/user/my-products', authenticate, async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            products
        });
    } catch (error) {
        console.error('Get my products error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching your products',
            error: error.message
        });
    }
});

export default router;
