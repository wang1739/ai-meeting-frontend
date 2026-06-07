import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import MeetingList from "@/pages/MeetingList";
import CreateMeeting from "@/pages/CreateMeeting";
import MeetingEntrance from "@/pages/MeetingEntrance";
import MeetingRoom from "@/pages/MeetingRoom";
import MeetingReview from "@/pages/MeetingReview";
import SearchPage from "@/pages/SearchPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import { useTheme } from "@/hooks/useTheme";

function AppContent() {
  useTheme();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/meeting/:meetingId" element={<MeetingEntrance />} />
      
      <Route element={<ProtectedRoute />}>
        {/* Full-screen meeting routes — outside AppLayout for independent layout */}
        <Route path="/meeting/:meetingId/room" element={<MeetingRoom />} />
        <Route path="/meeting/:meetingId/review" element={<MeetingReview />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/meetings" element={<MeetingList />} />
          <Route path="/meetings/new" element={<CreateMeeting />} />
          <Route path="/meetings/:id/edit" element={<CreateMeeting />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}