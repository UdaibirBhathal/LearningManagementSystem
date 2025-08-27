import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authProvider";

export default function LoginPage() {
  const nav = useNavigate();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      if (isRegister) {
        await register(form.name, form.email, form.password, form.role);
      } else {
        await login(form.email, form.password);
      }
      nav("/home");
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title justify-center">{isRegister ? "Create account" : "Login"}</h2>

          <form onSubmit={onSubmit} className="space-y-3">
            {isRegister && (
              <>
                <input
                  className="input input-bordered w-full"
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <select
                  className="select select-bordered w-full"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="STUDENT">Student</option>
                  <option value="INSTRUCTOR">Instructor</option>
                </select>
              </>
            )}

            <input
              className="input input-bordered w-full"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="input input-bordered w-full"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            {error && <p className="text-error text-sm">{error}</p>}

            <button className="btn btn-primary w-full">
              {isRegister ? "Register" : "Login"}
            </button>
          </form>

          <div className="divider">OR</div>
          <button className="btn btn-ghost" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Already have an account? Login" : "New here? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
