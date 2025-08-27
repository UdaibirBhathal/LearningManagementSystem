import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/requireAuth.js";
import {
  courseProgress,
  completeReading,
  submitQuiz,
} from "./progress.controller.js";

const r = Router();

r.get("/course/:courseId", requireAuth, courseProgress);
r.post("/complete-reading/:lectureId", requireAuth, requireRole(["STUDENT"]), completeReading);
r.post("/submit-quiz/:lectureId", requireAuth, requireRole(["STUDENT"]), submitQuiz);

export default r;
