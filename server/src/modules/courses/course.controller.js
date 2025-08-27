import Course from "./course.model.js";
import { Lecture } from "../lectures/lecture.model.js";

export async function createCourse(req, res) {
  try {
    const { title, description } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ message: "Title required" });
    const course = await Course.create({
      title: title.trim(),
      description: description || "",
      instructor: req.user.sub
    });
    res.status(201).json(course);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function listCourses(req, res) {
  const query = req.user.role === "INSTRUCTOR" ? { instructor: req.user.sub } : {};
  const courses = await Course.find(query)
    .populate("instructor", "name email")
    .sort({ createdAt: -1 });
  res.json(courses);
}

export async function getCourse(req, res) {
  const { id } = req.params;

  const course = await Course.findById(id)
    .populate("instructor", "name email")
    .lean();
  if (!course) return res.status(404).json({ message: "Course not found" });

  const lectures = await Lecture.find({ course: id })
    .sort({ order: 1 })
    .lean();

  res.json({ course, lectures });
}
