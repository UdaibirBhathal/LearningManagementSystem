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

  // Delete course (instructor only)
  const deleteCourse = useMutation({
    mutationFn: async () => (await api.delete(`/api/courses/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.removeQueries({ queryKey: ["course", id] });
      nav(-1);
    },
  });

  // Delete lecture (instructor only)
  const deleteLecture = useMutation({
    mutationFn: async (lectureId) => (await api.delete(`/api/lectures/${lectureId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course", id] });
    },
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

  const handleDeleteCourse = () => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    deleteCourse.mutate();
  };

  const handleDeleteLecture = (lectureId) => {
    if (!confirm("Delete this lecture?")) return;
    deleteLecture.mutate(lectureId);
  };

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
  const isOwner = user?.role === "INSTRUCTOR" && (user.id === course?.instructor?._id || user.id === course?.instructor?.id);
  const enrolled = !!status?.enrolled;
  const canAccess = isOwner || enrolled; // instructors can always access their own course lectures

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <button className="btn btn-ghost w-fit" onClick={() => nav(-1)}>← Back</button>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          {isOwner && (
            <div className="card-actions flex items-center gap-2">
              {/* Add lecture page (your existing component) */}
              <Link to={`/instructor/courses/${id}/add-lecture`} className="btn btn-outline btn-sm">Add Lecture</Link>
              {/* Edit course goes to EditCourse.jsx */}
              <Link to={`/instructor/courses/${id}/edit`} className="btn btn-outline btn-sm">Edit Course</Link>
              {/* Delete course triggers cascade on server */}
              <button onClick={handleDeleteCourse} className="btn btn-error btn-sm" disabled={deleteCourse.isPending}>
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

        <div className="divider" />

        <ul className="menu bg-base-100 rounded-box">
          {lectures.map((lec) => (
            <li key={lec._id} className={!canAccess ? "disabled opacity-60" : ""}>
              <div className="flex items-center justify-between">
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
                  <div className="flex items-center gap-2 ml-3">
                    {/* Edit lecture goes to EditLecture.jsx */}
                    <Link to={`/instructor/lectures/${lec._id}/edit`} className="btn btn-xs btn-outline">Edit</Link>
                    <button onClick={() => handleDeleteLecture(lec._id)} className="btn btn-xs btn-error" disabled={deleteLecture.isPending}>
                      {deleteLecture.isPending ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
