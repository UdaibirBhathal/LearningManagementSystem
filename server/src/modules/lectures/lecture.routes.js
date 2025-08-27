import { Router } from "express";
import { addLecture, getLecture, listLecturesForInstructor, updateLecture, deleteLecture } from "./lecture.controller.js";
import { requireAuth, requireRole } from "../../middleware/requireAuth.js";

const r = Router();

r.post("/:courseId", requireAuth, requireRole(["INSTRUCTOR"]), addLecture);
r.get("/course/:courseId", requireAuth, requireRole(["INSTRUCTOR"]), listLecturesForInstructor);
r.get("/:lectureId", requireAuth, getLecture);
r.put("/:lectureId", requireAuth, requireRole(["INSTRUCTOR"]), updateLecture);
r.delete("/:lectureId", requireAuth, requireRole(["INSTRUCTOR"]), deleteLecture);

export default r;
