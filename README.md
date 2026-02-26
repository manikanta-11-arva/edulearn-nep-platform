# EduLearn – NEP Aligned Learning Platform 🎓

EduLearn is a comprehensive, production-ready Full-Stack learning management system built to align with the **National Education Policy (NEP) 2020**. It features a credit-based learning system, role-based access control (Student, Faculty, Admin), and a modern, responsive UI.

![Project Status](https://img.shields.io/badge/Status-Development-orange)
![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue)

## 🌟 Key Features

-   **Credit-Based System**: Tracks student progress through earned academic credits.
-   **Role-Based Dashboards**: 
    -   **Students**: Browse courses, enroll, and view academic records.
    -   **Faculty**: Manage course content and grade students.
    -   **Admin**: Total control over users (students/faculty) and global course management.
-   **Modern Tech Stack**: Built with Node.js, Express, and MongoDB.
-   **Premium UI/UX**: Dark-themed, glassmorphic design using Vanilla CSS for high performance.
-   **Secure Authentication**: JWT-based auth with encrypted password storage.

## 🛠️ Tech Stack

-   **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism), JavaScript (ES6+).
-   **Backend**: Node.js, Express.js.
-   **Database**: MongoDB with Mongoose ODM.
-   **Security**: JSON Web Tokens (JWT), Bcrypt.js.
-   **Dev Tools**: Nodemon, Live-Server.

## 📂 Project Structure

```text
fsd-pbl/
├── edulearn-backend/     # Express API Server
│   ├── config/           # Database configuration
│   ├── middleware/       # Auth & Error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API Endpoints
│   └── server.js         # Entry point
└── edulearn-frontend/    # Client-side Website
    ├── css/              # Custom styling
    ├── js/               # API integration logic
    └── *.html            # Various portal pages
```

## 🚀 Getting Started

### Prerequisites
-   Node.js installed
-   MongoDB running locally

### 1. Setup Backend
```bash
cd edulearn-backend
npm install
# Create a .env file with PORT=5001 and MONGO_URI=mongodb://localhost:27017/edulearn
npm run dev
```

### 2. Setup Frontend
```bash
cd edulearn-frontend
npm install
npm run dev
```

## 🔐 API Endpoints (Quick Reference)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/courses` | List all courses |
| GET | `/api/users/profile` | Get user dashboard data |

## 📜 License
This project is licensed under the MIT License.

---
Created as part of the **FSD PBL** (Full Stack Development - Project Based Learning).
