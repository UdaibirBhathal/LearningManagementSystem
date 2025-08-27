import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

export default function LecturePage() {
  const { id: courseId, lectureId } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState({ submitted: false, passed: false, percent: 0 });
  const [quizError, setQuizError] = useState("");

  // Current lecture
  const { data: lecture, isLoading, isError, error } = useQuery({
    queryKey: ["lecture", lectureId],
    queryFn: async () => (await api.get(`/api/lectures/${lectureId}`)).data,
  });

  // Course (for total lectures + next lecture navigation and to update locks after progress)
  const { data: courseData } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => (await api.get(`/api/courses/${courseId}`)).data,
  });

  // Progress for this course
  const { data: progress } = useQuery({
    queryKey: ["progress", courseId],
    queryFn: async () => (await api.get(`/api/progress/course/${courseId}`)).data,
  });

  const completedSet = useMemo(
    () => new Set((progress?.completedLectureIds || []).map(String)),
    [progress]
  );
  const isAlreadyCompleted = completedSet.has(String(lectureId));

  const lecturePct = useMemo(() => (isAlreadyCompleted ? 100 : 0), [isAlreadyCompleted]);

  const computeNextLectureId = () => {
    const list = courseData?.lectures || [];
    if (!lecture) return null;
    // find next lecture by order, stable by _id
    const idx = list.findIndex((l) => String(l._id) === String(lectureId));
    if (idx >= 0 && idx + 1 < list.length) return list[idx + 1]._id;
    return null;
  };

  const afterProgressUpdate = () => {
    qc.invalidateQueries({ queryKey: ["progress", courseId] });
    qc.invalidateQueries({ queryKey: ["course", courseId] });
  };

  const completeReading = useMutation({
    mutationFn: async () => (await api.post(`/api/progress/complete-reading/${lectureId}`)).data,
    onSuccess: () => {
      afterProgressUpdate();
      const nextId = computeNextLectureId();
      if (nextId) {
        nav(`/courses/${courseId}/lecture/${nextId}`);
      }
    },
  });

  const submitQuiz = useMutation({
    mutationFn: async () => (await api.post(`/api/progress/submit-quiz/${lectureId}`, { answers })).data,
    onMutate: () => setQuizError(""),
    onSuccess: (res) => {
      setQuizResult({ submitted: true, passed: !!res?.passed, percent: res?.percent ?? 0 });
      afterProgressUpdate();
      if (res?.passed) {
        const nextId = computeNextLectureId();
        if (nextId) setTimeout(() => nav(`/courses/${courseId}/lecture/${nextId}`), 900);
      }
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || "Server error";
      setQuizError(msg);
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
    const msg = error?.response?.data?.message;
    return (
      <>
        <Navbar />
        <div className="p-6 max-w-3xl mx-auto">
          {status === 403 ? (
            <div className="alert alert-warning">
              {msg === "Locked. Complete previous lecture(s) first." ? (
                <>This lecture is locked. Please complete previous lecture(s) first.</>
              ) : (
                <>Please enroll to access lectures.</>
              )}
            </div>
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

        {/* Per-lecture progress */}
        <div className="mt-2 text-sm opacity-75">
          Progress for this lecture: {lecturePct}%
        </div>

        {lecture.type === "READING" ? (
          <div className="space-y-4">
            {lecture.contentText && <p className="leading-relaxed">{lecture.contentText}</p>}
            {lecture.contentUrl && (
              <a href={lecture.contentUrl} className="link link-primary" target="_blank" rel="noreferrer">
                Open resource
              </a>
            )}
            <div className="flex items-center gap-3">
              {!isAlreadyCompleted ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => completeReading.mutate()}
                  disabled={completeReading.isPending}
                >
                  {completeReading.isPending ? "Marking..." : "Mark as Complete"}
                </button>
              ) : (
                <span className="badge badge-success">Completed</span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {(lecture.questions || []).map((q, qi) => {
              const chosen = answers[qi];
              const wasSubmitted = quizResult.submitted;
              const correctIdx = q.correctIndex;
              return (
                <div key={qi} className="p-4 bg-base-100 rounded-xl shadow">
                  <p className="font-semibold mb-2">{qi + 1}. {q.text}</p>
                  <div className="grid gap-2">
                    {q.options.map((opt, oi) => {
                      const isCorrect = wasSubmitted && oi === correctIdx;
                      const isChosen = chosen === oi;
                      const showAsCorrect = wasSubmitted && isCorrect;
                      const showAsWrongChoice = wasSubmitted && isChosen && oi !== correctIdx;
                      return (
                        <label key={oi} className={`label cursor-pointer justify-start gap-2 ${showAsCorrect ? 'text-success' : ''} ${showAsWrongChoice ? 'text-error' : ''}`}>
                          <input
                            type="radio"
                            name={`q-${qi}`}
                            className="radio"
                            checked={isChosen}
                            disabled={wasSubmitted}
                            onChange={() => {
                              if (wasSubmitted) return;
                              const next = [...answers];
                              next[qi] = oi;
                              setAnswers(next);
                            }}
                          />
                          <span>{opt}</span>
                          {showAsCorrect && <span className="ml-2 badge badge-success">Correct</span>}
                          {showAsWrongChoice && <span className="ml-2 badge badge-error">Your answer</span>}
                        </label>
                      );
                    })}
                  </div>
                  {wasSubmitted && chosen !== correctIdx && (
                    <div className="mt-2 text-sm opacity-75">Correct answer: <span className="font-medium">{q.options[correctIdx]}</span></div>
                  )}
                </div>
              );
            })}
            <div className="text-sm opacity-75">Progress for this lecture: {lecturePct}%</div>
            {quizError && <div className="alert alert-error text-sm">{quizError}</div>}
            <div className="flex items-center gap-3">
              {!quizResult.submitted ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => submitQuiz.mutate()}
                  disabled={submitQuiz.isPending}
                >
                  {submitQuiz.isPending ? "Submitting..." : "Submit Quiz"}
                </button>
              ) : (
                <div className={`badge ${quizResult.passed ? 'badge-success' : 'badge-error'}`}>
                  {quizResult.passed ? `Passed (${quizResult.percent}%)` : `Failed (${quizResult.percent}%)`}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
