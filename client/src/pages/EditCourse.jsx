import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [initialTitle, setInitialTitle] = useState("");
  const [initialDescription, setInitialDescription] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => (await api.get(`/api/courses/${id}`)).data,
  });

  useEffect(() => {
    if (data?.course) {
      const t = data.course.title || "";
      const d = data.course.description || "";
      setTitle(t);
      setDescription(d);
      // seed initial values once
      setInitialTitle((prev) => (prev === "" ? t : prev));
      setInitialDescription((prev) => (prev === "" ? d : prev));
    }
  }, [data]);
  const isDirty = title.trim() !== initialTitle || description.trim() !== initialDescription;

  const updateCourse = useMutation({
    mutationFn: async () =>
      (await api.put(`/api/courses/${id}`, { title, description })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course", id] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      navigate(`/courses/${id}`);
    },
    onError: (err) => setError(err?.response?.data?.message || "Failed to update course"),
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="p-6 max-w-2xl mx-auto">
          <span className="loading loading-dots loading-lg" />
        </div>
      </>
    );
  }

  if (isError || !data?.course) {
    return (
      <>
        <Navbar />
        <div className="p-6 max-w-2xl mx-auto">
          <div className="alert alert-error">Failed to load course.</div>
        </div>
      </>
    );
  }

  const onSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");
    if (!isDirty) return navigate(`/courses/${id}`);
    setError("");
    updateCourse.mutate();
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-2xl mx-auto">
        <button className="btn btn-ghost mb-2" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">Edit course</h1>

        <form onSubmit={onSubmit} className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            <label className="label">
              <span className="label-text">Course title</span>
            </label>
            <input
              className="input input-bordered w-full"
              placeholder="Course title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {error && <div className="text-error text-sm">{error}</div>}
            <div className="card-actions justify-end">
              <button type="button" className="btn" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={updateCourse.isPending || !isDirty}>
                {updateCourse.isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
