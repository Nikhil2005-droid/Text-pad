import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import WorkspacePage from "./pages/WorkspacePage.jsx";
import DocsPage from "./pages/DocsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<WorkspacePage />} />
        <Route path="workspace" element={<WorkspacePage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
