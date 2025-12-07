// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import React, { useEffect, useState, lazy, Suspense } from "react";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import Login from "./pages/Login";
import Forgot from "./pages/Forgot";
import OAuthCallback from "./pages/OAuthCallback";
import StudentList from "./components/StudentList.jsx";
import StudentProfile from "./components/StudentProfile.jsx";
import SubjectOpen from "./pages/SubjectOpen.jsx";
import TrainingProgram from "./pages/TrainingProgram.jsx";
import AdminTrainingProgram from "./pages/AdminTrainingProgram.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));

function Protected({ authed, children }) {
  return authed ? children : <Navigate to="/auth/login" replace />;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    token ? localStorage.setItem("token", token) : localStorage.removeItem("token");
  }, [token]);

  // Attempt silent refresh on first load if refresh cookie exists
  useEffect(() => {
    let cancelled = false;
    const tryRefresh = async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include", // send refresh_token cookie
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.token) {
          setToken(data.token);
          
          // Decode JWT to get user info
          try {
            const base64Url = data.token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            if (payload.role) localStorage.setItem("user_role", payload.role);
            if (payload.email) localStorage.setItem("user_email", payload.email);
          } catch (decodeErr) {
            console.warn("Failed to decode token:", decodeErr);
          }
        }
      } catch {
        /* ignore: stay logged out */
      }
    };
    tryRefresh();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to={token ? "/app/dashboard" : "/auth/login"} replace />} />

          <Route path="/auth/*" element={<AuthLayout />}>
            <Route path="login" element={<Login onAuthed={setToken} />} />
            <Route path="forgot" element={<Forgot />} />
          </Route>

          <Route path="/oauth/callback" element={<OAuthCallback onAuthed={setToken} />} />

          <Route
            path="/app/*"
            element={
              <Protected authed={!!token}>
                <AppLayout />
              </Protected>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="subject-open" element={<SubjectOpen />} />
            <Route path="training-program" element={<TrainingProgram />} />
            <Route path="admin/training-program" element={<AdminTrainingProgram />} />
            <Route path="students" element={<StudentList />} />
            <Route path="students/:student_id" element={<StudentProfile />} />
          </Route>

          <Route path="*" element={<div style={{ padding: 24 }}>404 - Not Found</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
