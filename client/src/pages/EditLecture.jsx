import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

export default function EditLecture() {
  const { id: courseId, lectureId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(1);
  const [type, setType] = useState("READING");
  const [contentText, setContentText] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [passPercent, setPassPercent] = useState(70);
  const [questions, setQuestions] = useState([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["lecture", lectureId],
    queryFn: async () => (await api.get(`/api/lectures/${lectureId}`)).data.lecture,
  });

  useEffect(() => {
    if (data) {
      setTitle(data.title || "");
      setOrder(data.order || 1);
      setType(data.type || "READING");
      setContentText(data.contentText || "");
      setContentUrl(data.contentUrl || "");
      setPassPercent(data.passPercent || 70);
      setQuestions(data.questions || []);
    }
  }, [data]);

  const updateLecture = useMutation({
    mutationFn: async () =>
      (await api.put(`/api/lectures/${lectureId}`, {
        title,
        order,
        type,
        contentText,
        contentUrl,
        passPercent,
        questions,
      })).data,
    onSuccess: () => navigate(`/courses/${courseId}`),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateLecture.mutate();
  };

  if (isLoading) return <div className="p-6">Loading lecture…</div>;
  if (error) return <div className="p-6 alert alert-error">Failed to load lecture.</div>;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <button className="btn btn-ghost mb-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="text-2xl font-bold mb-4">Edit Lecture</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input input-bordered w-full"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="number"
            className="input input-bordered w-full"
            placeholder="Order"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />

          <select
            className="select select-bordered w-full"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="READING">Reading</option>
            <option value="QUIZ">Quiz</option>
          </select>

          {type === "READING" ? (
            <>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Content text"
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
              />
              <input
                className="input input-bordered w-full"
                placeholder="Content URL"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
              />
            </>
          ) : (
            <>
              <input
                type="number"
                className="input input-bordered w-full"
                placeholder="Passing percent"
                value={passPercent}
                onChange={(e) => setPassPercent(Number(e.target.value))}
              />
              {/* basic quiz question editor (expand as needed) */}
              {questions.map((q, qi) => (
                <div key={qi} className="p-2 border rounded space-y-2">
                  <input
                    className="input input-bordered w-full"
                    placeholder="Question text"
                    value={q.text}
                    onChange={(e) => {
                      const copy = [...questions];
                      copy[qi].text = e.target.value;
                      setQuestions(copy);
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() =>
                  setQuestions([...questions, { text: "", options: [], correctIndex: 0 }])
                }
              >
                + Add Question
              </button>
            </>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={updateLecture.isPending}>
            {updateLecture.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </>
  );
}
