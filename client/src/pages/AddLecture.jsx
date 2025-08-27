import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";

export default function AddLecture() {
  const { id: courseId } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const [type, setType] = useState("READING");
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(1);

  // reading
  const [contentText, setContentText] = useState("");
  const [contentUrl, setContentUrl] = useState("");

  // quiz
  const [passPercent, setPassPercent] = useState(70);
  const [questions, setQuestions] = useState([
    { text: "", options: ["", ""], correctIndex: 0 },
  ]);

  const addLecture = useMutation({
    mutationFn: async (payload) => (await api.post(`/api/lectures/${courseId}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course", courseId] });
      nav(`/courses/${courseId}`);
    },
  });

  const onSubmit = () => {
    if (!title.trim()) return;
    const base = { type, title, order: Number(order) };
    const payload =
      type === "READING"
        ? { ...base, contentText: contentText || undefined, contentUrl: contentUrl || undefined }
        : { ...base, passPercent: Number(passPercent), questions };
    addLecture.mutate(payload);
  };

  const addQuestion = () => setQuestions([...questions, { text: "", options: ["", ""], correctIndex: 0 }]);
  const updateQuestion = (idx, patch) => {
    const next = [...questions];
    next[idx] = { ...next[idx], ...patch };
    setQuestions(next);
  };
  const updateOption = (qi, oi, value) => {
    const next = [...questions];
    const opts = [...next[qi].options];
    opts[oi] = value;
    next[qi].options = opts;
    setQuestions(next);
  };
  const addOption = (qi) => {
    const next = [...questions];
    next[qi].options = [...next[qi].options, ""];
    setQuestions(next);
  };
  const removeOption = (qi, oi) => {
    const next = [...questions];
    next[qi].options = next[qi].options.filter((_, i) => i !== oi);
    if (next[qi].correctIndex >= next[qi].options.length) next[qi].correctIndex = 0;
    setQuestions(next);
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <button className="btn btn-ghost w-fit" onClick={() => nav(-1)}>← Back</button>
        <h1 className="text-2xl font-bold">Add Lecture</h1>

        <div className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input input-bordered w-full" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input className="input input-bordered w-full" type="number" min="1" placeholder="Order" value={order} onChange={(e) => setOrder(e.target.value)} />
              <select className="select select-bordered w-full" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="READING">READING</option>
                <option value="QUIZ">QUIZ</option>
              </select>
            </div>

            {type === "READING" ? (
              <div className="space-y-3">
                <textarea className="textarea textarea-bordered w-full" rows={5} placeholder="Content text (optional)"
                  value={contentText} onChange={(e) => setContentText(e.target.value)} />
                <input className="input input-bordered w-full" placeholder="Content URL (optional)"
                  value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3 items-center">
                  <label className="label">
                    <span className="label-text">Pass %</span>
                  </label>
                  <input className="input input-bordered w-28" type="number" min="0" max="100"
                    value={passPercent} onChange={(e) => setPassPercent(e.target.value)} />
                </div>

                <div className="space-y-3">
                  {questions.map((q, qi) => (
                    <div key={qi} className="p-4 bg-base-100 rounded-xl border">
                      <input className="input input-bordered w-full mb-2" placeholder={`Question ${qi + 1}`}
                        value={q.text} onChange={(e) => updateQuestion(qi, { text: e.target.value })} />

                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input className="input input-bordered flex-1" placeholder={`Option ${oi + 1}`}
                              value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} />
                            <label className="label cursor-pointer gap-2">
                              <input type="radio" name={`correct-${qi}`} className="radio"
                                checked={q.correctIndex === oi}
                                onChange={() => updateQuestion(qi, { correctIndex: oi })} />
                              <span className="text-sm">correct</span>
                            </label>
                            {q.options.length > 2 && (
                              <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeOption(qi, oi)}>✕</button>
                            )}
                          </div>
                        ))}
                        <button type="button" className="btn btn-outline btn-xs" onClick={() => addOption(qi)}>Add option</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline btn-sm" onClick={addQuestion}>Add question</button>
                </div>
              </div>
            )}

            <div className="card-actions justify-end">
              <button className="btn" onClick={() => nav(-1)}>Cancel</button>
              <button className="btn btn-primary" onClick={onSubmit} disabled={addLecture.isPending || !title.trim()}>
                {addLecture.isPending ? "Saving..." : "Save Lecture"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
