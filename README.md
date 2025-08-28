# LearningManagementSystem

A full-stack Learning Management System (LMS) that allows instructors to create and manage courses with lectures, and students to enroll, consume course content, complete quizzes, and track progress.

Built with a MERN-style architecture:
	•	React (Vite + Tailwind + DaisyUI) for the frontend
	•	Node.js (Express + MongoDB) for the backend
	•	JWT Authentication for secure role-based access

Features
	•	Authentication & Authorization
	•	Register/login with email & password
	•	JWT-based access & refresh tokens
	•	Role-based guards: Instructor vs Student
	•	Course Management (Instructors)
	•	Create, edit, delete courses
	•	Add lectures (Reading / Quiz types)
	•	Sequential learning flow enforced
	•	Student Experience
	•	Enroll in courses
	•	Access lectures sequentially
	•	Submit quizzes & track scores
	•	Reset progress anytime
	•	System Features
	•	RESTful API
	•	MongoDB schemas with Mongoose
	•	Validation with Zod
	•	Secure middleware (Helmet, CORS, Rate limiting)

Setup Instructions

1. Prerequisites
•	Node.js (>= 18.x)
•	MongoDB (local or Atlas cluster)
•	npm or yarn

3. Clone the Repository
• git clone https://github.com/UdaibirBhathal/LearningManagementSystem.git
• cd LearningManagementSystem

4. Backend Setup
• cd server
• npm install
• create .env file and paste the below snippet
PORT=5050
MONGO_URI=mongodb://127.0.0.1:27017/lms
CORS_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
• run the backend with npm start

5. Frontend Setup
• cd client
• npm install
• create .env file and paste the below snippet
VITE_API_BASE=http://localhost:5050
• run the frontend with npm run dev

API Endpoints

Auth (/api/auth)
	•	POST /register → Register new user
	•	POST /login → Login and receive JWT tokens
	•	GET /me → Get current logged-in user
	•	POST /refresh → Refresh access token
	•	POST /logout → Logout

Courses (/api/courses)
	•	GET / → List courses (instructors see their own)
	•	GET /:id → Get single course with lectures
	•	POST / (Instructor only) → Create course
	•	PUT /:id (Instructor only) → Update course
	•	DELETE /:id (Instructor only) → Delete course

Enrollments (/api/enrollments)
	•	POST /:courseId/enroll (Student only) → Enroll in course
	•	GET /:courseId/status → Check if student is enrolled

Lectures (/api/lectures)
	•	POST /:courseId (Instructor only) → Add lecture
	•	GET /course/:courseId (Instructor only) → List lectures for instructor
	•	GET /:lectureId → Get lecture (sequential access enforced)
	•	PUT /:lectureId (Instructor only) → Update lecture
	•	DELETE /:lectureId (Instructor only) → Delete lecture

Progress (/api/progress)
	•	GET /course/:courseId → Get student’s progress
	•	POST /complete-reading/:lectureId (Student only) → Mark reading as complete
	•	POST /submit-quiz/:lectureId (Student only) → Submit quiz answers
	•	POST /reset-course/:courseId (Student only) → Reset progress

 Technology Choices Explained
	•	React (Vite, React Router, React Query) → Fast development, modern state management for API calls, client-side routing.
	•	Tailwind + DaisyUI → Rapid UI prototyping, mobile-first responsive design.
	•	Express + MongoDB (Mongoose) → Well-known backend stack, flexible schema for courses, lectures, and progress tracking.
	•	JWT Authentication → Secure, stateless, supports both access & refresh tokens.
	•	Zod Validation → Safer request validation at the API layer.

 Running the App
	1.	Start backend (npm start inside server/).
	2.	Start frontend (npm run dev inside client/).
	3.	Open http://localhost:5173 in your browser.

 Backend (server/package.json)

Dependencies
	•	@tanstack/react-query (⚠️ seems mistakenly added to backend, usually frontend only)
	•	axios
	•	bcrypt
	•	cloudinary
	•	cookie-parser
	•	cors
	•	dotenv
	•	express
	•	express-rate-limit
	•	helmet
	•	http-errors
	•	jsonwebtoken
	•	mongoose
	•	morgan
	•	multer
	•	react-router-dom (⚠️ frontend lib, also mistakenly in backend)
	•	zod

Dev Dependencies
	•	eslint
	•	eslint-config-prettier
	•	eslint-plugin-import
	•	nodemon
	•	prettier

⸻

Frontend (client/package.json)

Dependencies
	•	@tanstack/react-query
	•	axios
	•	react
	•	react-dom
	•	react-router-dom

Dev Dependencies
	•	@eslint/js
	•	@types/react
	•	@types/react-dom
	•	@vitejs/plugin-react
	•	autoprefixer
	•	daisyui
	•	eslint
	•	eslint-plugin-react-hooks
	•	eslint-plugin-react-refresh
	•	globals
	•	postcss
	•	tailwindcss
	•	vite
   
