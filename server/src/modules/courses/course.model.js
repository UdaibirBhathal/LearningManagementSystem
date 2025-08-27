import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    enrolledCount: { type: Number, default: 0 } // 👈 new
  },
  { timestamps: true }
);

courseSchema.index({ title: "text", description: "text" });

export default mongoose.model("Course", courseSchema);
