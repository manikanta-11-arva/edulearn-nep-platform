// ============================================================
// server.js – Entry point for EduLearn Backend
// ============================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: false }));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/academic-records', require('./routes/academicRecords'));
app.use('/api/admin', require('./routes/admin'));

// ── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🎓 EduLearn API – NEP Aligned Learning Platform',
    version: '1.0.0',
    status: 'running',
  });
});

// ── Global Error Handler (must be last) ───────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 EduLearn Server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
