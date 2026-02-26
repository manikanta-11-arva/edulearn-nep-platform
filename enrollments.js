// ============================================================
// routes/enrollments.js – Student Enrollment & Progress Routes
// POST   /api/enrollments                 (student – enroll)
// GET    /api/enrollments/my              (student – my enrollments)
// GET    /api/enrollments/course/:courseId (admin/faculty)
// PUT    /api/enrollments/:id/progress    (student – update progress)
// PUT    /api/enrollments/:id/drop        (student – drop course)
// ============================================================

const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const AcademicRecord = require('../models/AcademicRecord');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// ── POST Enroll in a course ───────────────────────────────────
router.post('/', protect, authorize('student'), async (req, res, next) => {
    try {
        const { courseId } = req.body;

        const course = await Course.findById(courseId);
        if (!course || !course.isActive) {
            return res.status(404).json({ success: false, message: 'Course not found or inactive' });
        }

        // Check if already enrolled
        const alreadyEnrolled = await Enrollment.findOne({
            student: req.user._id,
            course: courseId,
        });
        if (alreadyEnrolled) {
            return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
        }

        // Check enrollment cap
        const enrolledCount = await Enrollment.countDocuments({ course: courseId, status: 'active' });
        if (enrolledCount >= course.maxEnrollment) {
            return res.status(400).json({ success: false, message: 'Course enrollment is full' });
        }

        const enrollment = await Enrollment.create({
            student: req.user._id,
            course: courseId,
        });

        await enrollment.populate('course', 'name courseCode credits');

        res.status(201).json({
            success: true,
            message: `Successfully enrolled in ${course.name}`,
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
});

// ── GET My enrollments (logged-in student) ────────────────────
router.get('/my', protect, authorize('student'), async (req, res, next) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user._id })
            .populate('course', 'name courseCode credits category skills durationWeeks modules')
            .sort({ enrolledAt: -1 });

        res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
    } catch (error) {
        next(error);
    }
});

// ── GET All enrollments for a course (Admin/Faculty) ──────────
router.get('/course/:courseId', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        const enrollments = await Enrollment.find({ course: req.params.courseId })
            .populate('student', 'name email studentId')
            .sort({ enrolledAt: -1 });

        res.status(200).json({ success: true, count: enrollments.length, data: enrollments });
    } catch (error) {
        next(error);
    }
});

// ── PUT Update progress percentage ────────────────────────────
router.put('/:id/progress', protect, authorize('student'), async (req, res, next) => {
    try {
        const { progressPercentage, completedModules } = req.body;

        const enrollment = await Enrollment.findOne({
            _id: req.params.id,
            student: req.user._id,
        });

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        if (progressPercentage !== undefined) {
            enrollment.progressPercentage = progressPercentage;
        }
        if (completedModules) {
            enrollment.completedModules = completedModules;
        }

        // If 100% – award credits and update academic record
        if (enrollment.progressPercentage === 100) {
            const course = await Course.findById(enrollment.course);
            enrollment.creditsAwarded = course.credits;

            // Update student's total credits
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { creditsEarned: course.credits },
            });

            // Update academic record
            const record = await AcademicRecord.findOne({ student: req.user._id });
            if (record) {
                record.totalCreditsAttempted += course.credits;
                record.totalCreditsEarned += course.credits;
                // Add skills from course to student's academic record (unique only)
                const newSkills = course.skills.filter((s) => !record.skillsAcquired.includes(s));
                record.skillsAcquired.push(...newSkills);
                await record.save();
            }
        }

        await enrollment.save();
        await enrollment.populate('course', 'name courseCode credits');

        res.status(200).json({
            success: true,
            message: 'Progress updated',
            data: enrollment,
        });
    } catch (error) {
        next(error);
    }
});

// ── PUT Drop a course ─────────────────────────────────────────
router.put('/:id/drop', protect, authorize('student'), async (req, res, next) => {
    try {
        const enrollment = await Enrollment.findOne({
            _id: req.params.id,
            student: req.user._id,
            status: 'active',
        });

        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Active enrollment not found' });
        }

        enrollment.status = 'dropped';
        await enrollment.save();

        res.status(200).json({ success: true, message: 'Course dropped successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
