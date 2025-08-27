import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../components/AuthProvider";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";
import { useState } from "react";

export default function CoursePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => (await api.get(`/api/courses/${id}`)).data,
  });

  const { data: status } = useQuery({
    queryKey: ["enrollmentStatus", id],
    queryFn: async () => (await api.get(`/api/enrollments/${id}/status`)).data,
  });

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
  const enrolled = !!status?.enrolled;

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <button className="btn btn-ghost w-fit" onClick={() => history.back()}>← Back</button>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{course.title}</h1>
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
            <li key={lec._id} className={!enrolled ? "disabled opacity-60" : ""}>
              {enrolled ? (
                <Link to={`/courses/${id}/lecture/${lec._id}`}>
                  <span className="badge mr-2">{lec.type}</span>
                  <span>#{lec.order} — {lec.title}</span>
                </Link>
              ) : (
                <div>
                  <span className="badge mr-2">{lec.type}</span>
                  <span>#{lec.order} — {lec.title} (locked)</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
