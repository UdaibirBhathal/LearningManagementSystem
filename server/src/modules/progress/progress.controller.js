import Progress from "./progress.model.js";
import { Lecture } from "../lectures/lecture.model.js";

export async function completeReading(req, res) {
  const { lectureId } = req.params;
  const lecture = await Lecture.findById(lectureId);
  if (!lecture || lecture.type !== "READING") return res.status(400).json({ message: "Invalid reading lecture" });

  const doc = await Progress.findOneAndUpdate(
    { student: req.user.sub, course: lecture.course },
    {
      $addToSet: { completedLectureIds: lecture._id }
    },
    { new: true, upsert: true }
  );
  res.json({ ok: true, completed: doc.completedLectureIds.length });
}

export async function submitQuiz(req, res) {
  const { lectureId } = req.params;
  const { answers } = req.body || {};
  const lecture = await Lecture.findById(lectureId);
  if (!lecture || lecture.type !== "QUIZ") return res.status(400).json({ message: "Invalid quiz lecture" });
  if (!Array.isArray(answers)) return res.status(400).json({ message: "answers[] required" });

  const total = lecture.questions.length;
  let correct = 0;
  lecture.questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct += 1;
  });
  const percent = Math.round((correct / total) * 100);
  const passed = percent >= (lecture.passPercent ?? 70);

  // update progress on pass
  let updated;
  if (passed) {
    updated = await Progress.findOneAndUpdate(
      { student: req.user.sub, course: lecture.course },
      {
        $addToSet: { completedLectureIds: lecture._id },
        $pull: { scores: { lecture: lecture._id } },
        $push: { scores: { lecture: lecture._id, percent } }
      },
      { new: true, upsert: true }
    );
  } else {
    updated = await Progress.findOneAndUpdate(
      { student: req.user.sub, course: lecture.course },
      {
        $pull: { scores: { lecture: lecture._id } },
        $push: { scores: { lecture: lecture._id, percent } }
      },
      { new: true, upsert: true }
    );
  }

  res.json({ scorePercent: percent, passed, progressCompleted: updated.completedLectureIds.length });
}

export async function courseProgress(req, res) {
  const { courseId } = req.params;
  const doc = await Progress.findOne({ student: req.user.sub, course: courseId });
  const completedCount = doc?.completedLectureIds?.length || 0;
  res.json({ completedCount });
}
