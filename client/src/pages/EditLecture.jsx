import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

export default function EditLecture() {
  const { lectureId } = useParams(); // route: /instructor/lectures/:lectureId/edit
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Load lecture (server returns the lecture object directly)
  const { data: lecture, isLoading, isError } = useQuery({
    queryKey: ["lecture", lectureId],
    queryFn: async () => (await api.get(`/api/lectures/${lectureId}`)).data,
  });

  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(1);
  const [type, setType] = useState("READING"); // shown as read-only; type changes are not supported in backend
  const [contentText, setContentText] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [passPercent, setPassPercent] = useState(70);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!lecture) return;
    setTitle(lecture.title || "");
    setOrder(typeof lecture.order === "number" ? lecture.order : 1);
    setType(lecture.type || "READING");
    if (lecture.type === "READING") {
      setContentText(lecture.contentText || "");
      setContentUrl(lecture.contentUrl || "");
    } else if (lecture.type === "QUIZ") {
      setPassPercent(typeof lecture.passPercent === "number" ? lecture.passPercent : 70);
      setQuestions(
        Array.isArray(lecture.questions)
          ? lecture.questions.map((q) => ({
              text: q.text || "",
              options: Array.isArray(q.options) ? [...q.options] : ["", ""],
              correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
            }))
          : []
      );
    }
  }, [lecture]);

  const updateLecture = useMutation({
    mutationFn: async (payload) => (await api.put(`/api/lectures/${lectureId}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lecture", lectureId] });
      qc.invalidateQueries({ queryKey: ["course"] }); // parent lists may refetch depending on keys
      navigate(-1);
    },
    onError: (e) => setError(e?.response?.data?.message || "Failed to update lecture"),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");

    const payload = { title: title.trim(), order: Number(order) };
    if (type === "READING") {
      Object.assign(payload, { contentText, contentUrl });
    } else if (type === "QUIZ") {
      if (!Array.isArray(questions) || questions.length === 0) return setError("At least one question is required");
      for (const [i, q] of questions.entries()) {
        if (!q.text.trim()) return setError(`Question ${i + 1} text is required`);
        if (!Array.isArray(q.options) || q.options.length < 2) return setError(`Question ${i + 1} needs at least 2 options`);
        if (q.correctIndex < 0 || q.correctIndex >= q.options.length) return setError(`Question ${i + 1} has invalid correct option`);
      }
      Object.assign(payload, { passPercent: Number(passPercent), questions });
    }
    setError("");
    updateLecture.mutate(payload);
  };

  const addQuestion = () => setQuestions((qs) => [...qs, { text: "", options: ["", ""], correctIndex: 0 }]);
  const removeQuestion = (qi) => setQuestions((qs) => qs.filter((_, i) => i !== qi));
  const updateQuestion = (qi, patch) => setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  const addOption = (qi) => setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, options: [...q.options, ""] } : q)));
  const removeOption = (qi, oi) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi
          ? {
              ...q,
              options: q.options.filter((_, j) => j !== oi),
              correctIndex: q.correctIndex === oi ? 0 : q.correctIndex > oi ? q.correctIndex - 1 : q.correctIndex,
            }
          : q
      )
    );
  const updateOption = (qi, oi, value) => setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q)));

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="p-6 max-w-3xl mx-auto"><span className="loading loading-dots loading-lg" /></div>
      </>
    );
  }

  if (isError || !lecture) {
    return (
      <>
        <Navbar />
        <div className="p-6 max-w-3xl mx-auto"><div className="alert alert-error">Failed to load lecture.</div></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <button className="btn btn-ghost mb-2" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="text-3xl font-bold">Edit Lecture</h1>
        <div className="opacity-70">Type: <span className="badge">{type}</span></div>

        <form onSubmit={onSubmit} className="card bg-base-100 shadow">
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label"><span className="label-text">Title</span></label>
                <input className="input input-bordered w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lecture title" />
              </div>
              <div>
                <label className="label"><span className="label-text">Order</span></label>
                <input type="number" className="input input-bordered w-full" value={order} onChange={(e) => setOrder(Number(e.target.value))} min={1} />
              </div>
            </div>

            {type === "READING" && (
              <>
                <div>
                  <label className="label"><span className="label-text">Content (text)</span></label>
                  <textarea className="textarea textarea-bordered w-full" rows={6} value={contentText} onChange={(e) => setContentText(e.target.value)} placeholder="Reading content" />
                </div>
                <div>
                  <label className="label"><span className="label-text">Content URL (optional)</span></label>
                  <input className="input input-bordered w-full" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://..." />
                </div>
              </>
            )}

            {type === "QUIZ" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label"><span className="label-text">Pass Percentage</span></label>
                    <input type="number" className="input input-bordered w-full" min={1} max={100} value={passPercent} onChange={(e) => setPassPercent(Number(e.target.value))} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Questions</h2>
                  <button type="button" className="btn btn-sm" onClick={addQuestion}>+ Add Question</button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, qi) => (
                    <div key={qi} className="border rounded p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Question {qi + 1}</h3>
                        <button type="button" className="btn btn-xs btn-ghost" onClick={() => removeQuestion(qi)}>Remove</button>
                      </div>
                      <label className="label"><span className="label-text">Question Text</span></label>
                      <input className="input input-bordered w-full" value={q.text} onChange={(e) => updateQuestion(qi, { text: e.target.value })} />

                      <div className="mt-3 flex items-center justify-between">
                        <span className="label-text">Options</span>
                        <button type="button" className="btn btn-xs" onClick={() => addOption(qi)}>+ Add Option</button>
                      </div>
                      <div className="space-y-2 mt-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qi}`}
                              className="radio"
                              checked={q.correctIndex === oi}
                              onChange={() => updateQuestion(qi, { correctIndex: oi })}
                              title="Correct answer"
                            />
                            <input
                              className="input input-bordered flex-1"
                              value={opt}
                              onChange={(e) => updateOption(qi, oi, e.target.value)}
                            />
                            <button type="button" className="btn btn-xs btn-ghost" onClick={() => removeOption(qi, oi)} disabled={q.options.length <= 2}>
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {error && <div className="text-error text-sm">{error}</div>}
            <div className="card-actions justify-end">
              <button type="button" className="btn" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={updateLecture.isPending}>
                {updateLecture.isPending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
