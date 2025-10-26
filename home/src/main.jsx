import React from "react";
import ReactDOM from "react-dom/client"; // takes react code and makes it viewable
import { BrowserRouter } from "react-router-dom"; // for having sub-pages not reload everything
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
