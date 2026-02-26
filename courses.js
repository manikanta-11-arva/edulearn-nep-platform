// ============================================================
// routes/courses.js – Course CRUD Routes (NEP Aligned)
// POST   /api/courses          (admin/faculty – create)
// GET    /api/courses          (all – list with filters)
// GET    /api/courses/:id      (all – get one)
// PUT    /api/courses/:id      (admin/faculty – update)
// DELETE /api/courses/:id      (admin – delete)
// ============================================================

const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// ── POST Create a new course ──────────────────────────────────
router.post('/', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        // Auto-assign the creating faculty as the faculty reference if not provided
        if (!req.body.faculty) {
            req.body.faculty = req.user._id;
        }

        const course = await Course.create(req.body);
        await course.populate('faculty', 'name email department');

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course,
        });
    } catch (error) {
        next(error);
    }
});

// ── GET List courses with optional filters ────────────────────
router.get('/', protect, async (req, res, next) => {
    try {
        const {
            category,
            semester,
            level,
            skills,
            page = 1,
            limit = 10,
            search,
        } = req.query;

        const filter = { isActive: true };
        if (category) filter.category = category;
        if (semester) filter.semester = Number(semester);
        if (level) filter.level = level;
        if (skills) filter.skills = { $in: skills.split(',') };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const courses = await Course.find(filter)
            .populate('faculty', 'name email department')
            .populate('prerequisites', 'name courseCode credits')
            .populate('enrolledCount')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Course.countDocuments(filter);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: courses,
        });
    } catch (error) {
        next(error);
    }
});

// ── GET Single course by ID ───────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('faculty', 'name email department')
            .populate('prerequisites', 'name courseCode credits');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        next(error);
    }
});

// ── PUT Update a course ───────────────────────────────────────
router.put('/:id', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Faculty can only update their own courses; admin can update any
        if (
            req.user.role === 'faculty' &&
            course.faculty.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'You can only update courses you own',
            });
        }

        const updated = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('faculty', 'name email');

        res.status(200).json({ success: true, message: 'Course updated', data: updated });
    } catch (error) {
        next(error);
    }
});

// ── DELETE a course (Admin only) ──────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
