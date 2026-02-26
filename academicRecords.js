// ============================================================
// routes/academicRecords.js – Digital Academic Record Routes
// (NEP: Academic Bank of Credits)
// GET    /api/academic-records/my         (student – own record)
// GET    /api/academic-records/:studentId (admin/faculty)
// PUT    /api/academic-records/:id/verify (admin – verify record)
// PUT    /api/academic-records/:id/exit   (admin – record NEP exit)
// ============================================================

const express = require('express');
const router = express.Router();
const AcademicRecord = require('../models/AcademicRecord');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// ── GET My academic record (Student) ─────────────────────────
router.get('/my', protect, authorize('student'), async (req, res, next) => {
    try {
        const record = await AcademicRecord.findOne({ student: req.user._id })
            .populate('student', 'name email studentId academicLevel creditsEarned')
            .populate('courseRecords.course', 'name courseCode category');

        if (!record) {
            return res.status(404).json({ success: false, message: 'Academic record not found' });
        }

        res.status(200).json({ success: true, data: record });
    } catch (error) {
        next(error);
    }
});

// ── GET Academic record of a student (Admin/Faculty) ──────────
router.get('/:studentId', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        const record = await AcademicRecord.findOne({ student: req.params.studentId })
            .populate('student', 'name email studentId academicLevel creditsEarned')
            .populate('courseRecords.course', 'name courseCode category credits')
            .populate('verifiedBy', 'name');

        if (!record) {
            return res.status(404).json({ success: false, message: 'Academic record not found' });
        }

        res.status(200).json({ success: true, data: record });
    } catch (error) {
        next(error);
    }
});

// ── PUT Verify academic record (Admin only) ───────────────────
router.put('/:id/verify', protect, authorize('admin'), async (req, res, next) => {
    try {
        const record = await AcademicRecord.findByIdAndUpdate(
            req.params.id,
            {
                isVerified: true,
                verifiedBy: req.user._id,
                verifiedAt: new Date(),
            },
            { new: true }
        ).populate('student', 'name email studentId');

        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Academic record verified',
            data: record,
        });
    } catch (error) {
        next(error);
    }
});

// ── PUT Record NEP Exit Qualification ────────────────────────
// NEP allows students to exit at certificate/diploma/degree level
router.put('/:id/exit', protect, authorize('admin'), async (req, res, next) => {
    try {
        const { level, totalCredits } = req.body;

        const validLevels = ['certificate', 'diploma', 'degree', 'postgraduate'];
        if (!validLevels.includes(level)) {
            return res.status(400).json({ success: false, message: 'Invalid exit level' });
        }

        const record = await AcademicRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ success: false, message: 'Record not found' });
        }

        // Add exit qualification
        record.exitQualifications.push({
            level,
            awardedAt: new Date(),
            totalCredits: totalCredits || record.totalCreditsEarned,
        });
        record.currentLevel = level;
        await record.save();

        res.status(200).json({
            success: true,
            message: `NEP exit qualification '${level}' recorded`,
            data: record,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
