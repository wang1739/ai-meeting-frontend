import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import Dashboard from "@/pages/Dashboard";
import MeetingList from "@/pages/MeetingList";
import CreateMeeting from "@/pages/CreateMeeting";
import MeetingRoom from "@/pages/MeetingRoom";
import MeetingReview from "@/pages/MeetingReview";
import SearchPage from "@/pages/SearchPage";
import SettingsPage from "@/pages/SettingsPage";
import { useTheme } from "@/hooks/useTheme";

function AppContent() {
  useTheme();
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meetings" element={<MeetingList />} />
        <Route path="/meetings/new" element={<CreateMeeting />} />
        <Route path="/meetings/:id/edit" element={<CreateMeeting />} />
        <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
        <Route path="/meeting/:meetingId/review" element={<MeetingReview />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
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