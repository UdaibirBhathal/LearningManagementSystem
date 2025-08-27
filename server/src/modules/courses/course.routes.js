import { Router } from "express";
import { createCourse, listCourses, getCourse } from "./course.controller.js";
import { requireAuth, requireRole } from "../../middleware/requireAuth.js";

const r = Router();

r.get("/", listCourses);
r.get("/:courseId", requireAuth, getCourse);
r.post("/", requireAuth, requireRole("INSTRUCTOR"), createCourse);

export default r;
