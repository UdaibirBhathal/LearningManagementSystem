import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="navbar bg-base-100 shadow mb-4">
      <div className="flex-1">
        <Link to="/home" className="btn btn-ghost text-xl">LMS</Link>
      </div>
      <div className="flex-none gap-2">
        {user && <span className="text-sm opacity-70 mr-2">{user.email} · {user.role}</span>}
        {user ? (
          <button className="btn btn-outline" onClick={() => { logout(); nav("/login"); }}>
            Logout
          </button>
        ) : (
          <Link to="/login" className="btn btn-primary">Login</Link>
        )}
      </div>
    </div>
  );
}
