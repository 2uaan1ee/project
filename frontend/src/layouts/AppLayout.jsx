// src/layouts/AppLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

export default function AppLayout() {
  return (
    <div className="app__root">
      <Navbar />
      <main style={{ padding: "24px" }}>
        <Outlet />
      </main>
    </div>
  );
}
