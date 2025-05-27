import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Cleanups from "./pages/Cleanups";
import NewCleanup from "./pages/NewCleanup";
import CleanupDetail from "./pages/CleanupDetail";
import Schedule from "./pages/Schedule";
import NewEvent from "./pages/NewEvent";
import EventDetail from "./pages/EventDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Index />} />
          <Route path="cleanups" element={<Cleanups />} />
          <Route path="cleanups/new" element={<NewCleanup />} />
          <Route path="cleanup/:naddr" element={<CleanupDetail />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="schedule/new" element={<NewEvent />} />
          <Route path="event/:naddr" element={<EventDetail />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;