import { Navigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
