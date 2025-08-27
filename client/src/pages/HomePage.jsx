import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import Navbar from "../components/Navbar";

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await api.get("/api/courses")).data,
  });

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Available Courses</h1>
          <button className="btn btn-outline btn-sm" onClick={() => refetch()}>Refresh</button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-40 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <div className="alert alert-error">
            <span>Could not load courses. Try again.</span>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data ?? []).map((c) => (
              <div key={c._id} className="card bg-base-100 shadow hover:shadow-lg">
                <div className="card-body">
                  <h2 className="card-title">{c.title}</h2>
                  <p className="line-clamp-3">{c.description}</p>
                  <p className="text-sm opacity-70">
                    Instructor: {c.instructor?.name ?? "Unknown"}
                  </p>
                  <div className="mt-1"><span className="badge badge-ghost">Enrolled: {c.enrolledCount ?? 0}</span></div>
                  <Link to={`/courses/${c._id}`} className="btn btn-primary btn-sm mt-2">Details</Link>
                </div>
              </div>
            ))}
            {data?.length === 0 && (
              <div className="col-span-full text-center opacity-70">
                No courses yet. Ask an instructor to create one.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
