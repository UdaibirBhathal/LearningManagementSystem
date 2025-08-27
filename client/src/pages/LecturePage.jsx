import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

export default function LecturePage() {
  const { id: courseId, lectureId } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState([]);

  const { data: lecture, isLoading, isError, error } = useQuery({
    queryKey: ["lecture", lectureId],
    queryFn: async () => (await api.get(`/api/lectures/${lectureId}`)).data,
  });

  const completeReading = useMutation({
    mutationFn: async () => (await api.post(`/api/progress/complete-reading/${lectureId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress", courseId] });
      alert("Marked as complete ✅");
    },
  });

  const submitQuiz = useMutation({
    mutationFn: async () => (await api.post(`/api/progress/submit-quiz/${lectureId}`, { answers })).data,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["progress", courseId] });
      alert(`Score: ${res.scorePercent}%. Passed: ${res.passed ? "Yes" : "No"}`);
    },
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="p-6 max-w-3xl mx-auto">
          <span className="loading loading-dots loading-lg" />
        </div>
      </>
    );
  }

  if (isError || !lecture) {
    const status = error?.response?.status;
    return (
      <>
        <Navbar />
        <div className="p-6 max-w-3xl mx-auto">
          {status === 403 ? (
            <div className="alert alert-warning">Please enroll to access lectures.</div>
          ) : (
            <div className="alert alert-error">Failed to load lecture.</div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <button className="btn btn-ghost w-fit" onClick={() => nav(-1)}>← Back</button>

        <h1 className="text-2xl font-bold">{lecture.title}</h1>
        <div className="badge">{lecture.type}</div>

        {lecture.type === "READING" ? (
          <div className="space-y-4">
            {lecture.contentText && <p className="leading-relaxed">{lecture.contentText}</p>}
            {lecture.contentUrl && (
              <a href={lecture.contentUrl} className="link link-primary" target="_blank" rel="noreferrer">
                Open resource
              </a>
            )}
            <button
              className="btn btn-primary"
              onClick={() => completeReading.mutate()}
              disabled={completeReading.isPending}
            >
              {completeReading.isPending ? "Marking..." : "Mark as Complete"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {(lecture.questions || []).map((q, qi) => (
              <div key={qi} className="p-4 bg-base-100 rounded-xl shadow">
                <p className="font-semibold mb-2">{qi + 1}. {q.text}</p>
                <div className="grid gap-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="label cursor-pointer justify-start gap-2">
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        className="radio"
                        checked={answers[qi] === oi}
                        onChange={() => {
                          const next = [...answers];
                          next[qi] = oi;
                          setAnswers(next);
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="btn btn-primary"
              onClick={() => submitQuiz.mutate()}
              disabled={submitQuiz.isPending}
            >
              {submitQuiz.isPending ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
