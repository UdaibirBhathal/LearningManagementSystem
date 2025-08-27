import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";

export default function CreateCourse() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "" });
  const [error, setError] = useState("");

  const createCourse = useMutation({
    mutationFn: async () => (await api.post("/api/courses", form)).data,
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      nav(`/courses/${course._id}`);
    },
    onError: (err) => setError(err?.response?.data?.message || "Failed to create course"),
  });

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">Create a new course</h1>
        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            <input
              className="input input-bordered w-full"
              placeholder="Course title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Description"
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            {error && <p className="text-error text-sm">{error}</p>}
            <div className="card-actions justify-end">
              <button className="btn" onClick={() => history.back()}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => createCourse.mutate()}
                disabled={createCourse.isPending || !form.title.trim()}
              >
                {createCourse.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
