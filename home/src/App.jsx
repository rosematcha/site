import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectsPage";
import ResumePage from "./pages/ResumePage";
import GuestbookPage from "./pages/GuestbookPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const location = useLocation();

  return (
    <>
      <Header />
      <main>
        <div className="page-transition" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/guestbook" element={<GuestbookPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default App;
