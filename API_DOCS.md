# EduLearn API – Postman / REST Client Examples

> Base URL: `http://localhost:5000/api`

---

## 1. AUTH ROUTES

### Register a Student
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Priya Sharma",
  "email": "priya@student.edu",
  "password": "password123",
  "role": "student",
  "studentId": "STU2024001"
}
```

### Register a Faculty
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Dr. Rajesh Kumar",
  "email": "rajesh@faculty.edu",
  "password": "faculty@123",
  "role": "faculty",
  "department": "Computer Science"
}
```

### Register an Admin
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@edulearn.edu",
  "password": "admin@123",
  "role": "admin"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "priya@student.edu",
  "password": "password123"
}
```
**Response includes `token` – use it as `Bearer <token>` in all protected routes.**

### Get My Profile
```
GET /api/auth/me
Authorization: Bearer <token>
```

---

## 2. USER ROUTES (Admin)

### List All Users (with role filter)
```
GET /api/users?role=student&page=1&limit=20
Authorization: Bearer <admin_token>
```

### List All Students
```
GET /api/users/students
Authorization: Bearer <admin_or_faculty_token>
```

### Get Single User
```
GET /api/users/<userId>
Authorization: Bearer <admin_token>
```

### Update User
```
PUT /api/users/<userId>
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "department": "Data Science",
  "academicLevel": "postgraduate"
}
```

### Deactivate User
```
DELETE /api/users/<userId>
Authorization: Bearer <admin_token>
```

---

## 3. COURSE ROUTES

### Create a Course (Faculty/Admin)
```
POST /api/courses
Authorization: Bearer <faculty_token>
Content-Type: application/json

{
  "name": "Introduction to Machine Learning",
  "courseCode": "CS302",
  "description": "An NEP-aligned course covering ML fundamentals with practical skill development.",
  "credits": 4,
  "category": "elective",
  "semester": 5,
  "level": "degree",
  "durationWeeks": 16,
  "maxEnrollment": 60,
  "skills": ["Python", "Data Analysis", "Model Training", "Scikit-Learn"],
  "modules": [
    { "title": "Introduction to ML", "description": "Overview of ML concepts", "order": 1 },
    { "title": "Supervised Learning", "description": "Regression and Classification", "order": 2 },
    { "title": "Unsupervised Learning", "description": "Clustering and Dimensionality Reduction", "order": 3 },
    { "title": "Model Evaluation", "description": "Cross-validation and metrics", "order": 4 }
  ]
}
```

### List Courses with Filters
```
GET /api/courses?category=elective&semester=5&skills=Python,Data+Analysis&page=1&limit=10
Authorization: Bearer <token>
```

### Search Courses
```
GET /api/courses?search=machine+learning
Authorization: Bearer <token>
```

### Get Single Course
```
GET /api/courses/<courseId>
Authorization: Bearer <token>
```

### Update Course (Faculty – own courses only)
```
PUT /api/courses/<courseId>
Authorization: Bearer <faculty_token>
Content-Type: application/json

{
  "description": "Updated description with NEP modular approach",
  "maxEnrollment": 75,
  "skills": ["Python", "Data Analysis", "Model Training", "Scikit-Learn", "Deep Learning"]
}
```

### Delete Course (Admin)
```
DELETE /api/courses/<courseId>
Authorization: Bearer <admin_token>
```

---

## 4. ENROLLMENT ROUTES

### Enroll in a Course (Student)
```
POST /api/enrollments
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "courseId": "<courseId>"
}
```

### Get My Enrollments (Student)
```
GET /api/enrollments/my
Authorization: Bearer <student_token>
```

### Get Course Enrollments (Admin/Faculty)
```
GET /api/enrollments/course/<courseId>
Authorization: Bearer <faculty_token>
```

### Update Progress (Student)
```
PUT /api/enrollments/<enrollmentId>/progress
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "progressPercentage": 75,
  "completedModules": ["Introduction to ML", "Supervised Learning", "Unsupervised Learning"]
}
```

### Drop a Course (Student)
```
PUT /api/enrollments/<enrollmentId>/drop
Authorization: Bearer <student_token>
```

---

## 5. GRADE ROUTES

### Assign Grade (Faculty/Admin)
```
POST /api/grades
Authorization: Bearer <faculty_token>
Content-Type: application/json

{
  "studentId": "<studentId>",
  "courseId": "<courseId>",
  "marksObtained": 87,
  "assessmentType": "final",
  "remarks": "Excellent understanding of ML concepts"
}
```

**Grade Point & Letter Grade auto-calculated:**
| Marks | Letter | Grade Point |
|-------|--------|-------------|
| ≥ 90  | O      | 10          |
| ≥ 85  | A+     | 9           |
| ≥ 75  | A      | 8           |
| ≥ 65  | B+     | 7           |
| ≥ 55  | B      | 6           |
| ≥ 50  | C      | 5           |
| ≥ 40  | P      | 4           |
| < 40  | F      | 0           |

### Get Student's Grades (Admin/Faculty)
```
GET /api/grades/student/<studentId>
Authorization: Bearer <faculty_token>
```

### Get Course Grades (Admin/Faculty)
```
GET /api/grades/course/<courseId>
Authorization: Bearer <faculty_token>
```

### Get My Grades (Student)
```
GET /api/grades/my
Authorization: Bearer <student_token>
```

### Update Grade (Admin/Faculty)
```
PUT /api/grades/<gradeId>
Authorization: Bearer <faculty_token>
Content-Type: application/json

{
  "marksObtained": 90,
  "remarks": "Re-evaluated after recheck"
}
```

---

## 6. ACADEMIC RECORD ROUTES

### Get My Academic Record / Transcript (Student)
```
GET /api/academic-records/my
Authorization: Bearer <student_token>
```

### Get Student's Academic Record (Admin/Faculty)
```
GET /api/academic-records/<studentId>
Authorization: Bearer <admin_token>
```

### Verify Academic Record (Admin)
```
PUT /api/academic-records/<recordId>/verify
Authorization: Bearer <admin_token>
```

### Record NEP Exit Qualification (Admin)
```
PUT /api/academic-records/<recordId>/exit
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "level": "diploma",
  "totalCredits": 60
}
```

---

## NEP Feature Summary

| NEP Feature | Implementation |
|---|---|
| Credit-Based System | Every course has `credits`; student `creditsEarned` auto-updated |
| Modular Courses | `modules[]` sub-documents in Course |
| Skill Tagging | `skills[]` on Course; acquired skills tracked in AcademicRecord |
| Multiple Entry/Exit | `exitQualifications[]` in AcademicRecord; `academicLevel` on User |
| Digital Academic Records | `AcademicRecord` model with CGPA, transcript, skill portfolio |
| Academic Bank of Credits | `abcId` field on AcademicRecord |
| Multidisciplinary | `category` field (core/elective/multidisciplinary/vocational etc.) |
