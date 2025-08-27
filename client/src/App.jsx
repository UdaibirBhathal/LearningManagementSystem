import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import RequireRole from "./routes/RequireRole";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CoursePage from "./pages/CoursePage";
import LecturePage from "./pages/LecturePage";
import CreateCourse from "./pages/CreateCourse";
import AddLecture from "./pages/AddLecture";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/courses/:id" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
      <Route path="/courses/:id/lecture/:lectureId" element={<ProtectedRoute><LecturePage /></ProtectedRoute>} />

      {/* Instructor-only */}
      <Route
        path="/instructor/new-course"
        element={
          <ProtectedRoute>
            <RequireRole role="INSTRUCTOR">
              <CreateCourse />
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:id/add-lecture"
        element={
          <ProtectedRoute>
            <RequireRole role="INSTRUCTOR">
              <AddLecture />
            </RequireRole>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<div className="p-10 text-center">Not Found</div>} />
    </Routes>
  );
}
