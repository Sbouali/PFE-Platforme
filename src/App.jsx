import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/temp";
import TeacherDashboard from "./pages/TeacherDashboard";
import SubjectsPage from "./pages/SubjectsPage";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard-teacher" element={<TeacherDashboard />} />
      <Route path="/subjects" element={<SubjectsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
