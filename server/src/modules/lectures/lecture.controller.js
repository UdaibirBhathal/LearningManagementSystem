// server/src/modules/lectures/lecture.controller.js
import Course from "../courses/course.model.js";
import Enrollment from "../enrollments/enrollment.model.js";
import Progress from "../progress/progress.model.js";
import { Lecture, ReadingLecture, QuizLecture } from "./lecture.model.js";

export async function addLecture(req, res) {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructor.toString() !== req.user.sub) {
      return res.status(403).json({ message: "Not your course" });
    }

    let { type, title, order, contentText, contentUrl, passPercent, questions } = req.body || {};
    if (!["READING", "QUIZ"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }
    if (!title?.trim()) {
      return res.status(400).json({ message: "title required" });
    }
    if (typeof order !== "number") {
      const last = await Lecture.find({ course: courseId })
        .sort({ order: -1 })
        .limit(1)
        .lean();
      order = last.length ? last[0].order + 1 : 1;
    }

    let lecture;
    if (type === "READING") {
      lecture = await ReadingLecture.create({ course: courseId, order, type, title, contentText, contentUrl });
    } else {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "questions required for QUIZ" });
      }
      lecture = await QuizLecture.create({
        course: courseId,
        order,
        type,
        title,
        passPercent: passPercent ?? 70,
        questions
      });
    }
    res.status(201).json(lecture);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

export async function listLecturesForInstructor(req, res) {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });
  if (course.instructor.toString() !== req.user.sub) {
    return res.status(403).json({ message: "Not your course" });
  }
  const lectures = await Lecture.find({ course: courseId }).sort({ order: 1 }).lean();
  res.json(lectures);
}

export async function updateLecture(req, res) {
  const { lectureId } = req.params;
  const { title, order, contentText, contentUrl, passPercent, questions } = req.body || {};

  const lecture = await Lecture.findById(lectureId);
  if (!lecture) return res.status(404).json({ message: "Lecture not found" });

  const course = await Course.findById(lecture.course);
  if (!course || course.instructor.toString() !== req.user.sub) {
    return res.status(403).json({ message: "Not your course" });
  }

  if (title !== undefined) lecture.title = title;
  if (order !== undefined) lecture.order = order;

  if (lecture.type === "READING") {
    if (contentText !== undefined) lecture.contentText = contentText;
    if (contentUrl !== undefined) lecture.contentUrl = contentUrl;
  } else if (lecture.type === "QUIZ") {
    if (passPercent !== undefined) lecture.passPercent = passPercent;
    if (questions !== undefined) lecture.questions = questions;
  }

  await lecture.save();
  res.json(lecture);
}

export async function deleteLecture(req, res) {
  const { lectureId } = req.params;
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) return res.status(404).json({ message: "Lecture not found" });

  const course = await Course.findById(lecture.course);
  if (!course || course.instructor.toString() !== req.user.sub) {
    return res.status(403).json({ message: "Not your course" });
  }

  // Remove this lecture from all students' progress (completed list and scores)
  await Progress.updateMany(
    { course: lecture.course },
    {
      $pull: {
        completedLectureIds: lecture._id,
        scores: { lecture: lecture._id },
      },
    }
  );

  await lecture.deleteOne();
  res.json({ ok: true });
}

export async function getLecture(req, res) {
  const { lectureId } = req.params;
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) return res.status(404).json({ message: "Lecture not found" });

  const course = await Course.findById(lecture.course);
  if (req.user.role === "INSTRUCTOR" && course && String(course.instructor) === req.user.sub) {
    return res.json(lecture);
}

  const isEnrolled = await Enrollment.findOne({ student: req.user.sub, course: lecture.course }).lean();
  if (!isEnrolled) return res.status(403).json({ message: "Please enroll to access lectures" });

  // --- sequential access guard ---
  const progress = await Progress.findOne({
    student: req.user.sub,
    course: lecture.course,
  })
    .select("completedLectureIds")
    .lean();

  const completedIds = new Set((progress?.completedLectureIds || []).map(String));
  const all = await Lecture.find({ course: lecture.course })
    .sort({ order: 1, _id: 1 }) // stable order; break ties by _id
    .select("_id")
    .lean();

  const idx = all.findIndex((l) => String(l._id) === String(lecture._id));
  const allPrevDone = all.slice(0, idx).every((l) => completedIds.has(String(l._id)));
  if (!allPrevDone) {
    return res.status(403).json({ message: "Locked. Complete previous lecture(s) first." });
  }

  res.json(lecture);
}
