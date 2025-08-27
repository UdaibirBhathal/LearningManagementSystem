import Progress from "./progress.model.js";
import { Lecture } from "../lectures/lecture.model.js";
import Enrollment from "../enrollments/enrollment.model.js";

export async function completeReading(req, res) {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId);
    if (!lecture || lecture.type !== "READING") return res.status(400).json({ message: "Invalid reading lecture" });

    // must be enrolled to record progress
    const isEnrolled = await Enrollment.findOne({ student: req.user.sub, course: lecture.course }).lean();
    if (!isEnrolled) return res.status(403).json({ message: "Enroll to complete" });

    const doc = await Progress.findOneAndUpdate(
      { student: req.user.sub, course: lecture.course },
      { $addToSet: { completedLectureIds: lecture._id } },
      { new: true, upsert: true }
    ).lean();

    return res.json({ ok: true, progress: { completedLectureIds: doc.completedLectureIds || [], scores: doc.scores || [] } });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function submitQuiz(req, res) {
  try {
    const { lectureId } = req.params;
    const { answers = [] } = req.body || {};

    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture || lecture.type !== "QUIZ") {
      return res.status(400).json({ message: "Invalid quiz lecture" });
    }

    // must be enrolled
    const isEnrolled = await Enrollment.findOne({
      student: req.user.sub,
      course: lecture.course,
    }).lean();
    if (!isEnrolled) return res.status(403).json({ message: "Enroll to submit" });

    // grade
    const total = lecture.questions.length || 0;
    let correct = 0;
    lecture.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct += 1;
    });
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const passed = percent >= (lecture.passPercent ?? 70);

    // IMPORTANT: write a field name that the schema accepts (use `score`)
    // and avoid $pull/$push races — just push a new attempt; it's fine to keep history
    const update = {
      $push: { scores: { lecture: lecture._id, score: percent, at: new Date() } },
    };
    if (passed) update.$addToSet = { completedLectureIds: lecture._id };

    const doc = await Progress.findOneAndUpdate(
      { student: req.user.sub, course: lecture.course },
      update,
      { new: true, upsert: true }
    ).lean();

    // normalize for client: always expose `percent` in the response
    const scores = Array.isArray(doc?.scores)
      ? doc.scores.map((s) => ({
          lecture: s.lecture,
          percent: typeof s.percent === "number" ? s.percent : s.score,
          at: s.at,
        }))
      : [];

    return res.json({
      passed,
      percent,
      progress: {
        completedLectureIds: doc?.completedLectureIds || [],
        scores,
      },
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function courseProgress(req, res) {
  try {
    const { courseId } = req.params;
    const doc = await Progress.findOne({ student: req.user.sub, course: courseId }).lean();
    if (!doc) {
      return res.json({ completedLectureIds: [], scores: [] });
    }
    return res.json({ completedLectureIds: doc.completedLectureIds || [], scores: doc.scores || [] });
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
}
