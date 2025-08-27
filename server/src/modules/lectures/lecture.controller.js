import Course from "../courses/course.model.js";
import Enrollment from "../enrollments/enrollment.model.js";
import { Lecture, ReadingLecture, QuizLecture } from "./lecture.model.js";

export async function addLecture(req, res) {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructor.toString() !== req.user.sub) return res.status(403).json({ message: "Not your course" });

    const { type, title, order, contentText, contentUrl, passPercent, questions } = req.body || {};
    if (!["READING", "QUIZ"].includes(type)) return res.status(400).json({ message: "Invalid type" });
    if (!title?.trim() || typeof order !== "number") return res.status(400).json({ message: "title/order required" });

    let lecture;
    if (type === "READING") {
      lecture = await ReadingLecture.create({ course: courseId, order, type, title, contentText, contentUrl });
    } else {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "questions required for QUIZ" });
      }
      lecture = await QuizLecture.create({ course: courseId, order, type, title, passPercent: passPercent ?? 70, questions });
    }
    res.status(201).json(lecture);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getLecture(req, res) {
  const { lectureId } = req.params;
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) return res.status(404).json({ message: "Lecture not found" });

  const isEnrolled = await Enrollment.findOne({ student: req.user.sub, course: lecture.course }).lean();
  if (!isEnrolled) return res.status(403).json({ message: "Please enroll to access lectures" });

  res.json(lecture);
}
