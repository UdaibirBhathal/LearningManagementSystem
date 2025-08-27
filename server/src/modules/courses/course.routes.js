import { Router } from "express";
import { createCourse, listCourses, getCourse, updateCourse, deleteCourse } from "./course.controller.js";
import { requireAuth, requireRole } from "../../middleware/requireAuth.js";

const r = Router();

r.get("/", requireAuth, listCourses);
r.get("/:id", requireAuth, getCourse);
r.post("/", requireAuth, requireRole(["INSTRUCTOR"]), createCourse);
r.put("/:id", requireAuth, requireRole(["INSTRUCTOR"]), updateCourse);
r.delete("/:id", requireAuth, requireRole(["INSTRUCTOR"]), deleteCourse);

export default r;
