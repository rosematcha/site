import React from "react";
import ReactDOM from "react-dom/client"; // takes react code and makes it viewable
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom"; // for having sub-pages not reload everything

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
