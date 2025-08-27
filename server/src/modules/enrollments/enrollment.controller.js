import Enrollment from "./enrollment.model.js";
import Course from "../courses/course.model.js";

export async function enrollInCourse(req, res) {
  const { courseId } = req.params;

  const existing = await Enrollment.findOne({ student: req.user.sub, course: courseId }).lean();
  if (existing) {
    const course = await Course.findById(courseId).select("enrolledCount");
    return res.json({ ok: true, enrolled: true, enrolledCount: course?.enrolledCount ?? 0 });
  }

  await Enrollment.create({ student: req.user.sub, course: courseId });
  const updated = await Course.findByIdAndUpdate(
    courseId,
    { $inc: { enrolledCount: 1 } },
    { new: true, select: "enrolledCount" }
  );

  return res.status(201).json({ ok: true, enrolled: true, enrolledCount: updated.enrolledCount });
}

export async function isEnrolled(req, res) {
  const { courseId } = req.params;
  const doc = await Enrollment.findOne({ student: req.user.sub, course: courseId }).lean();
  res.json({ enrolled: !!doc });
}
