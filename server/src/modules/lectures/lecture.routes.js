import { Router } from "express";
import { addLecture, getLecture } from "./lecture.controller.js";
import { requireAuth, requireRole } from "../../middleware/requireAuth.js";

const r = Router();

r.get("/:lectureId", requireAuth, getLecture);
r.post("/:courseId", requireAuth, requireRole("INSTRUCTOR"), addLecture);

export default r;
