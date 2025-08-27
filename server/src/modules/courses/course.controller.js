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

export async function listCourses(_req, res) {
  const courses = await Course.find().select("title description instructor").populate("instructor", "name email");
  res.json(courses);
}

export async function getCourse(req, res) {
  const { courseId } = req.params;
  const course = await Course.findById(courseId).populate("instructor", "name email");
  if (!course) return res.status(404).json({ message: "Course not found" });

  const lectures = await Lecture.find({ course: courseId }).select("title type order").sort({ order: 1 });
  res.json({ course, lectures });
}
