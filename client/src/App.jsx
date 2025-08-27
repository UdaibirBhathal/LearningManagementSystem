import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import RequireRole from "./routes/RequireRole";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CoursePage from "./pages/CoursePage";
import LecturePage from "./pages/LecturePage";
import CreateCourse from "./pages/CreateCourse";
import AddLecture from "./pages/AddLecture";
import EditCourse from "./pages/EditCourse";
import EditLecture from "./pages/EditLecture";

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
        element={
          <ProtectedRoute>
            <RequireRole role="INSTRUCTOR">
              <Outlet />
            </RequireRole>
          </ProtectedRoute>
        }
      >
        <Route path="/instructor/new-course" element={<CreateCourse />} />
        <Route path="/instructor/courses/:id/add-lecture" element={<AddLecture />} />
        <Route path="/instructor/courses/:id/edit" element={<EditCourse />} />
        <Route path="/instructor/lectures/:lectureId/edit" element={<EditLecture />} />
      </Route>

      <Route path="*" element={<div className="p-10 text-center">Not Found</div>} />
    </Routes>
  );
}
