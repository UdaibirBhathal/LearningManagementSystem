import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";
import { useState } from "react";

export default function CoursePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

  // Load course + lectures
  const { data, isLoading, isError } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => (await api.get(`/api/courses/${id}`)).data,
  });

  // Enrollment status (for student view)
  const { data: status } = useQuery({
    queryKey: ["enrollmentStatus", id],
    queryFn: async () => (await api.get(`/api/enrollments/${id}/status`)).data,
  });

  // Compute enrolled early so hooks below can use it
  const enrolled = Boolean(status?.enrolled);

  // Student progress (must be before any early return; gated by `enabled`)
  const { data: progress } = useQuery({
    queryKey: ["progress", id],
    queryFn: async () => (await api.get(`/api/progress/course/${id}`)).data,
    enabled: Boolean(enrolled && user?.role === "STUDENT"),
  });

  // Enroll (student)
  const enroll = useMutation({
    mutationFn: async () => (await api.post(`/api/enrollments/${id}/enroll`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollmentStatus", id] });
      qc.invalidateQueries({ queryKey: ["course", id] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      setMessage("Enrolled successfully 🎉");
      setTimeout(() => setMessage(""), 2000);
    },
  });

  // Reset full course progress (student only); no dependency on lectures here to keep hooks stable
  const resetProgress = useMutation({
    mutationFn: async () => (await api.post(`/api/progress/reset-course/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress", id] });
      qc.invalidateQueries({ queryKey: ["course", id] });
      setMessage("Progress reset. You can start again.");
      // optionally navigate to the first lecture
      if (Array.isArray(data?.lectures) && data.lectures.length > 0) {
        const first = data.lectures[0];
        if (first?._id) {
          setTimeout(() => nav(`/courses/${id}/lecture/${first._id}`), 600);
        }
      }
      setTimeout(() => setMessage(""), 2000);
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || "Failed to reset progress";
      setMessage(msg);
      setTimeout(() => setMessage(""), 2500);
    },
  });

  // Delete course (instructor only)
  const deleteCourse = useMutation({
    mutationFn: async () => (await api.delete(`/api/courses/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      setMessage("Course deleted");
      setTimeout(() => setMessage(""), 1500);
      nav("/");
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || "Failed to delete course";
      setMessage(msg);
      setTimeout(() => setMessage(""), 2500);
    },
  });

  // Delete lecture (instructor only)
  const deleteLecture = useMutation({
    mutationFn: async (lectureId) => (await api.delete(`/api/lectures/${lectureId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course", id] });
      setMessage("Lecture deleted");
      setTimeout(() => setMessage(""), 1500);
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || "Failed to delete lecture";
      setMessage(msg);
      setTimeout(() => setMessage(""), 2500);
    },
  });

  // Early returns AFTER all hooks above are declared
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="p-6 max-w-4xl mx-auto"><span className="loading loading-dots loading-lg" /></div>
      </>
    );
  }
  if (isError || !data) {
    return (
      <>
        <Navbar />
        <div className="p-6 max-w-4xl mx-auto"><div className="alert alert-error">Failed to load course.</div></div>
      </>
    );
  }

  const { course, lectures } = data;

  // Instructor access
  const instructorId = course?.instructor?._id ?? course?.instructor?.id;
  const isOwner = user?.role === "INSTRUCTOR" && user?.id && instructorId && user.id === instructorId;
  const canAccess = isOwner || enrolled;

  // Progress numbers (text only)
  const done = progress?.completedLectureIds?.length || 0;
  const total = Array.isArray(lectures) ? lectures.length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <button className="btn btn-ghost w-fit" onClick={() => nav(-1)}>← Back</button>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          {isOwner && (
            <div className="card-actions flex items-center gap-2">
              <Link to={`/instructor/courses/${id}/add-lecture`} className="btn btn-outline btn-sm">Add Lecture</Link>
              <Link to={`/instructor/courses/${id}/edit`} className="btn btn-outline btn-sm">Edit Course</Link>
              <button
                className="btn btn-error btn-sm"
                onClick={() => {
                  if (confirm("Delete this course? This will remove all lectures and unenroll students.")) {
                    deleteCourse.mutate();
                  }
                }}
                disabled={deleteCourse.isPending}
              >
                {deleteCourse.isPending ? "Deleting..." : "Delete Course"}
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="badge badge-ghost">Enrolled: {course.enrolledCount ?? 0}</span>
            {!enrolled ? (
              user?.role === "STUDENT" ? (
                <button className="btn btn-primary btn-sm" onClick={() => enroll.mutate()} disabled={enroll.isPending}>
                  {enroll.isPending ? "Enrolling..." : "Enroll"}
                </button>
              ) : (
                <span className="badge">Students can enroll</span>
              )
            ) : (
              <span className="badge badge-success">You’re enrolled</span>
            )}
          </div>
        </div>

        {message && <div className="alert alert-success">{message}</div>}

        <p className="opacity-80">{course.description}</p>
        <p className="text-sm opacity-70">Instructor: {course.instructor?.name} ({course.instructor?.email})</p>

        {Boolean(enrolled && user?.role === "STUDENT" && total > 0) && (
          <div className="text-sm opacity-75">Progress: {done}/{total} ({pct}%)</div>
        )}

        {Boolean(enrolled && user?.role === "STUDENT" && isComplete) && (
          <div className="mt-2">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => resetProgress.mutate()}
              disabled={resetProgress.isPending}
            >
              {resetProgress.isPending ? "Resetting..." : "Restart Course"}
            </button>
          </div>
        )}

        <div className="divider" />

        {Array.isArray(lectures) && lectures.length > 0 ? (
          <ul className="menu bg-base-100 rounded-box">
            {lectures.map((lec) => (
              <li key={lec._id} className={!canAccess ? "disabled opacity-60" : ""}>
                <div className="flex items-center justify-between gap-3">
                  {canAccess ? (
                    <Link to={`/courses/${id}/lecture/${lec._id}`} className="truncate">
                      <span className="badge mr-2">{lec.type}</span>
                      <span>#{lec.order} — {lec.title}</span>
                    </Link>
                  ) : (
                    <div className="truncate">
                      <span className="badge mr-2">{lec.type}</span>
                      <span>#{lec.order} — {lec.title} (locked)</span>
                    </div>
                  )}

                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/instructor/courses/${id}/lectures/${lec._id}/edit`
                        }
                        className="btn btn-xs btn-outline"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={() => {
                          if (confirm("Delete this lecture? Progress will be updated accordingly.")) {
                            deleteLecture.mutate(lec._id);
                          }
                        }}
                        disabled={deleteLecture.isPending}
                      >
                        {deleteLecture.isPending ? "..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm opacity-70">No lectures yet.</div>
        )}
      </div>
    </>
  );
}
