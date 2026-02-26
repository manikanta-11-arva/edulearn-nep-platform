// ============================================================
// routes/admin.js – Admin-Only Routes
// GET  /api/admin/stats        – platform-wide statistics
// GET  /api/admin/users        – list all users
// PUT  /api/admin/users/:id    – update user (role, active status)
// DELETE /api/admin/users/:id  – deactivate user
// ============================================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', async (req, res, next) => {
    try {
        const [totalUsers, totalCourses, totalEnrollments, roleCounts] = await Promise.all([
            User.countDocuments({ isActive: true }),
            Course.countDocuments({ isActive: true }),
            Enrollment.countDocuments(),
            User.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]),
        ]);

        const roles = { admin: 0, faculty: 0, student: 0 };
        roleCounts.forEach(({ _id, count }) => { roles[_id] = count; });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalCourses,
                totalEnrollments,
                roles,
            },
        });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/admin/users ──────────────────────────────────────
router.get('/users', async (req, res, next) => {
    try {
        const { role, page = 1, limit = 20, search } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

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

// ── PUT /api/admin/users/:id ──────────────────────────────────
router.put('/users/:id', async (req, res, next) => {
    try {
        const { role, isActive, department, name } = req.body;
        const update = {};
        if (role) update.role = role;
        if (isActive !== undefined) update.isActive = isActive;
        if (department) update.department = department;
        if (name) update.name = name;

        const user = await User.findByIdAndUpdate(req.params.id, update, {
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

// ── DELETE /api/admin/users/:id – Deactivate (soft delete) ───
router.delete('/users/:id', async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'User deactivated', data: user });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
