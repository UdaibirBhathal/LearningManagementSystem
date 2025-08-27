import Course from "./course.model.js";
import { Lecture } from "../lectures/lecture.model.js";
import Enrollment from "../enrollments/enrollment.model.js";
import Progress from "../progress/progress.model.js";

export async function createCourse(req, res) {
  try {
    const { title, description } = req.body || {};
    const course = await Course.create({
      title: String(title).trim(),
      description: String(description),
      instructor: req.user.sub,
    });
    return res.json(course);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listCourses(req, res) {
  try {
    const q = {};
    if (req.user?.role === "INSTRUCTOR") {
      q.instructor = req.user.sub;
    }
    const courses = await Course.find(q)
      .populate("instructor", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(courses);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getCourse(req, res) {
  try {
    const { id } = req.params;
    const course = await Course.findById(id)
      .populate("instructor", "name email")
      .lean();
    if (!course) return res.status(404).json({ message: "Course not found" });
      const lectures = await Lecture.find({ course: id })
      .sort("order")
      .lean();
      return res.json({ course, lectures });
    } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const { title, description } = req.body || {};
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructor.toString() !== req.user.sub) {
      return res.status(403).json({ message: "Not your course" });
    }
    if (title !== undefined) course.title = String(title).trim();
    if (description !== undefined) course.description = String(description);
    await course.save();
    return res.json(course);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}


export async function deleteCourse(req, res) {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructor.toString() !== req.user.sub) {
      return res.status(403).json({ message: "Not your course" });
    }
    await Enrollment.deleteMany({ course: id });
    await Lecture.deleteMany({ course: id });
    await Progress.deleteMany({ course: id });
    await course.deleteOne();
        return res.json({ ok: true });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}
