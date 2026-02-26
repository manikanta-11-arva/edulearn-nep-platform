// ============================================================
// routes/grades.js – Grade Assignment & Retrieval Routes
// POST   /api/grades                      (faculty – assign grade)
// GET    /api/grades/student/:studentId   (admin/faculty)
// GET    /api/grades/course/:courseId     (admin/faculty)
// GET    /api/grades/my                   (student – own grades)
// PUT    /api/grades/:id                  (faculty – update grade)
// ============================================================

const express = require('express');
const router = express.Router();
const Grade = require('../models/Grade');
const Enrollment = require('../models/Enrollment');
const AcademicRecord = require('../models/AcademicRecord');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// ── POST Assign a grade (Faculty / Admin) ─────────────────────
router.post('/', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        const { studentId, courseId, marksObtained, assessmentType, remarks } = req.body;

        // Verify the student is enrolled in the course
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
        });
        if (!enrollment) {
            return res.status(400).json({
                success: false,
                message: 'Student is not enrolled in this course',
            });
        }

        const grade = await Grade.create({
            student: studentId,
            course: courseId,
            enrollment: enrollment._id,
            gradedBy: req.user._id,
            marksObtained,
            assessmentType: assessmentType || 'final',
            remarks,
        });

        // If it's a final grade – update the academic record transcript
        if (assessmentType === 'final' || !assessmentType) {
            const course = await Course.findById(courseId);
            const record = await AcademicRecord.findOne({ student: studentId });

            if (record && course) {
                // Replace existing entry if present, otherwise push
                const existingIdx = record.courseRecords.findIndex(
                    (r) => r.course?.toString() === courseId.toString()
                );

                const entry = {
                    course: course._id,
                    courseName: course.name,
                    courseCode: course.courseCode,
                    credits: course.credits,
                    marksObtained: grade.marksObtained,
                    letterGrade: grade.letterGrade,
                    gradePoint: grade.gradePoint,
                    semester: course.semester,
                    completedAt: new Date(),
                };

                if (existingIdx >= 0) {
                    record.courseRecords[existingIdx] = entry;
                } else {
                    record.courseRecords.push(entry);
                }

                // Recalculate CGPA
                record.recalculateCGPA();
                await record.save();
            }
        }

        await grade.populate([
            { path: 'student', select: 'name email studentId' },
            { path: 'course', select: 'name courseCode credits' },
            { path: 'gradedBy', select: 'name' },
        ]);

        res.status(201).json({
            success: true,
            message: 'Grade assigned successfully',
            data: grade,
        });
    } catch (error) {
        next(error);
    }
});

// ── GET Grades for a specific student (Admin/Faculty) ─────────
router.get('/student/:studentId', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        const grades = await Grade.find({ student: req.params.studentId })
            .populate('course', 'name courseCode credits')
            .populate('gradedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: grades.length, data: grades });
    } catch (error) {
        next(error);
    }
});

// ── GET Grades for a specific course (Admin/Faculty) ──────────
router.get('/course/:courseId', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        const grades = await Grade.find({ course: req.params.courseId })
            .populate('student', 'name email studentId')
            .populate('gradedBy', 'name')
            .sort({ marksObtained: -1 });

        res.status(200).json({ success: true, count: grades.length, data: grades });
    } catch (error) {
        next(error);
    }
});

// ── GET My grades (Student) ───────────────────────────────────
router.get('/my', protect, authorize('student'), async (req, res, next) => {
    try {
        const grades = await Grade.find({ student: req.user._id })
            .populate('course', 'name courseCode credits category')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: grades.length, data: grades });
    } catch (error) {
        next(error);
    }
});

// ── PUT Update grade (Admin/Faculty) ──────────────────────────
router.put('/:id', protect, authorize('admin', 'faculty'), async (req, res, next) => {
    try {
        const { marksObtained, remarks } = req.body;

        const grade = await Grade.findById(req.params.id);
        if (!grade) {
            return res.status(404).json({ success: false, message: 'Grade not found' });
        }

        if (marksObtained !== undefined) grade.marksObtained = marksObtained;
        if (remarks !== undefined) grade.remarks = remarks;
        await grade.save(); // Pre-save hook recalculates letter grade & gradePoint

        res.status(200).json({ success: true, message: 'Grade updated', data: grade });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
