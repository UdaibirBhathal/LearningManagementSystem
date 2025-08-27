import { Router } from "express";
import { createCourse, listCourses, getCourse } from "./course.controller.js";
import { requireAuth, requireRole } from "../../middleware/requireAuth.js";

const r = Router();

r.get("/", requireAuth, listCourses);
r.get("/:id", requireAuth, getCourse);
r.post("/", requireAuth, requireRole("INSTRUCTOR"), createCourse);

export default r;
