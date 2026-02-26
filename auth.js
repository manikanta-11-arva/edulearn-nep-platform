// ============================================================
// routes/auth.js – Authentication Routes
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me  (protected)
// ============================================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AcademicRecord = require('../models/AcademicRecord');
const { generateToken } = require('../middleware/auth');
const { protect } = require('../middleware/auth');

// ── @route   POST /api/auth/register ─────────────────────────
// ── @desc    Register a new user (admin/faculty/student)
// ── @access  Public
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, password, role, department, studentId } = req.body;

        // Check if email already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Create user (password auto-hashed via pre-save hook)
        const user = await User.create({ name, email, password, role, department, studentId });

        // For new students – initialize their academic record
        if (user.role === 'student') {
            await AcademicRecord.create({ student: user._id });
        }

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                department: user.department,
            },
        });
    } catch (error) {
        next(error);
    }
});

// ── @route   POST /api/auth/login ─────────────────────────────
// ── @desc    Login and get JWT token
// ── @access  Public
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Include password field (it's excluded by default via select:false)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Compare entered password with hashed password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                creditsEarned: user.creditsEarned,
                academicLevel: user.academicLevel,
            },
        });
    } catch (error) {
        next(error);
    }
});

// ── @route   GET /api/auth/me ─────────────────────────────────
// ── @desc    Get currently logged-in user profile
// ── @access  Private
router.get('/me', protect, async (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user,
    });
});

module.exports = router;
