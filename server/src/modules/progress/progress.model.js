import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    completedLectureIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
    scores: [
      {
        lecture: { type: mongoose.Schema.Types.ObjectId, ref: "Lecture", required: true },
        percent: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

progressSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model("Progress", progressSchema);
