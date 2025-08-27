import { Navigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";

export default function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/home" replace />;
  return children;
}
