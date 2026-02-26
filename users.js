// ============================================================
// routes/users.js – User Management Routes
// GET    /api/users            (admin only – list all)
// GET    /api/users/:id        (admin/faculty – get one)
// PUT    /api/users/:id        (admin – update user)
// DELETE /api/users/:id        (admin – deactivate user)
// GET    /api/users/students   (admin/faculty – list students)
// ============================================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// ── GET all users (Admin only) ────────────────────────────────
router.get('/', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { role, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role;

        const users = await User.find(filter)
            .select('-password')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: users,
        });
    } catch (error) {
        next(error);
    }
});

// ── GET all students (Admin & Faculty) ───────────────────────
router.get('/students', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('name email studentId creditsEarned academicLevel department createdAt')
            .sort({ name: 1 });

        res.status(200).json({ success: true, count: students.length, data: students });
    } catch (error) {
        next(error);
    }
});

// ── GET all faculty (Admin & Faculty) ────────────────────────
router.get('/faculty', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        const faculty = await User.find({ role: 'faculty' })
            .select('name email department createdAt isActive')
            .sort({ name: 1 });

        res.status(200).json({ success: true, count: faculty.length, data: faculty });
    } catch (error) {
        next(error);
    }
});

// ── GET single user by ID ─────────────────────────────────────
router.get('/:id', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// ── PUT update user (Admin only) ─────────────────────────────
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        // Don't allow password update through this route
        const { password, ...updateData } = req.body;

        const user = await User.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'User updated', data: user });
    } catch (error) {
        next(error);
    }
});

// ── DELETE (soft-delete / deactivate) user ────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
