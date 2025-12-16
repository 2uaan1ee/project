import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";   // ✅ thêm dòng này

const container = document.getElementById("root");
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);