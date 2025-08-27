import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CoursePage from "./pages/CoursePage";
import LecturePage from "./pages/LecturePage";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <ProtectedRoute>
            <CoursePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id/lecture/:lectureId"
        element={
          <ProtectedRoute>
            <LecturePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<div className="p-10 text-center">Not Found</div>} />
    </Routes>
  );
}
