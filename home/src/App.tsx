import { Navigate, Route, Routes } from "react-router-dom";

import { ContributionProvider } from "./components/ContributionProvider";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useRouteFocus } from "./hooks/useRouteFocus";
import GuestbookPage from "./pages/GuestbookPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import PhotosPage, { PhotoEventPage } from "./pages/PhotosPage";
import ProjectsPage from "./pages/ProjectsPage";
import ResumePage from "./pages/ResumePage";

export default function App() {
  useRouteFocus();
  return (
    <ContributionProvider>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<ProjectsPage />} path="/work" />
          <Route element={<Navigate replace to="/work" />} path="/projects" />
          <Route element={<ResumePage />} path="/resume" />
          <Route element={<PhotosPage />} path="/photos" />
          <Route element={<PhotoEventPage />} path="/photos/:eventId" />
          <Route element={<GuestbookPage />} path="/guestbook" />
          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </main>
      <Footer />
    </ContributionProvider>
  );
}
