import mongoose from "mongoose";

const base = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    order: { type: Number, required: true },
    type: { type: String, enum: ["READING", "QUIZ"], required: true },
    title: { type: String, required: true }
  },
  { timestamps: true, discriminatorKey: "type" }
);

export const Lecture = mongoose.model("Lecture", base);

const readingSchema = new mongoose.Schema({
  contentText: { type: String, default: "" },
  contentUrl: { type: String, default: "" }
});
export const ReadingLecture = Lecture.discriminator("READING", readingSchema);

const quizSchema = new mongoose.Schema({
  passPercent: { type: Number, default: 70 },
  questions: [
    {
      text: { type: String, required: true },
      options: [{ type: String, required: true }],
      correctIndex: { type: Number, required: true }
    }
  ]
});
export const QuizLecture = Lecture.discriminator("QUIZ", quizSchema);
