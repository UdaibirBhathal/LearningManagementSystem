// server/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import courseRoutes from "./modules/courses/course.routes.js";
import enrollmentRoutes from "./modules/enrollments/enrollment.routes.js";
import lectureRoutes from "./modules/lectures/lecture.routes.js";
import progressRoutes from "./modules/progress/progress.routes.js";


// 1) create app BEFORE using it
const app = express();

// 2) middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// 3) basic routes
app.get("/", (_req, res) => res.type("text").send("LMS API is running ✅"));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// 4) api routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/progress", progressRoutes);


// 5) export after everything is set up
export default app;
