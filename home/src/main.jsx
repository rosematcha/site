import React, { useEffect } from "react";
import ReactDOM from "react-dom/client"; // takes react code and makes it viewable
import { BrowserRouter, useLocation } from "react-router-dom"; // for having sub-pages not reload everything
import App from "./App.jsx";
import "./index.css";

if (typeof document !== "undefined" && !document.body.classList.contains("initial-visit")) {
  document.body.classList.add("initial-visit");
}

function AppWithInitialLoad() {
  const location = useLocation();

  useEffect(() => {
    if (document.body.classList.contains("initial-visit")) {
      document.body.classList.remove("initial-visit");
    }
  }, [location.pathname]);

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWithInitialLoad />
    </BrowserRouter>
  </React.StrictMode>,
);
