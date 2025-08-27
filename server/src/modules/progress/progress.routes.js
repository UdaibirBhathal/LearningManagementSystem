import { Router } from "express";
import { completeReading, submitQuiz, courseProgress } from "./progress.controller.js";
import { requireAuth } from "../../middleware/requireAuth.js";

const r = Router();

r.post("/complete-reading/:lectureId", requireAuth, completeReading);
r.post("/submit-quiz/:lectureId", requireAuth, submitQuiz);
r.get("/course/:courseId", requireAuth, courseProgress);

export default r;
