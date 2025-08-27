import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { requireRole } from "../../middleware/requireAuth.js";
import { enrollInCourse, isEnrolled } from "./enrollment.controller.js";

const r = Router();

r.post("/:courseId/enroll", requireAuth, requireRole(["STUDENT"]), enrollInCourse);
r.get("/:courseId/status", requireAuth, isEnrolled);

export default r;
