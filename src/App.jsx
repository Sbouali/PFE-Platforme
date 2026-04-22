import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/temp";
import TeacherDashboard from "./pages/TeacherDashboard";
import SubjectsPage from "./pages/SubjectsPage";
import JurySpacePage from "./pages/JurySpacePage";
import SupervisionPage from "./pages/SupervisionPage";
import JuryDetailsPage from "./pages/JuryDetailsPage";
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard-teacher" element={<TeacherDashboard />} />
      <Route path="/subjects" element={<SubjectsPage />} />
      <Route path="/jury-space" element={<JurySpacePage />} />
      <Route path="/supervision" element={<SupervisionPage />} />
      <Route path="/jury-space/:id" element={<JuryDetailsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
