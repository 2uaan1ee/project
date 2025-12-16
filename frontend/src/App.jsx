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
import SubjectList from "./pages/SubjectList.jsx";
import SubjectOpenList from "./pages/SubjectOpenList.jsx";
import TrainingProgram from "./pages/TrainingProgram.jsx";
import TuitionPayments from "./pages/TuitionPayments.jsx";
import AdminTrainingProgram from "./pages/AdminTrainingProgram.jsx";
import AdminSubjectOpen from "./pages/AdminSubjectOpen.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));

function Protected({ authed, ready, children }) {
  if (!ready) return <div style={{ padding: 24 }}>Loading...</div>;
  return authed ? children : <Navigate to="/auth/login" replace />;
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("token") || "");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    token ? sessionStorage.setItem("token", token) : sessionStorage.removeItem("token");
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

            if (payload.role) sessionStorage.setItem("user_role", payload.role);
            if (payload.email) sessionStorage.setItem("user_email", payload.email);
          } catch (decodeErr) {
            console.warn("Failed to decode token:", decodeErr);
          }
        }
      } catch {
        /* ignore: stay logged out */
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };
    tryRefresh();
    return () => {
      cancelled = true;
    };
  }, []);

  // If refresh endpoint fails (no cookie), still allow the app to render using existing sessionStorage token
  useEffect(() => {
    if (authReady) return;
    // Fallback to mark ready when there is an existing token but refresh returned early
    if (sessionStorage.getItem("token")) {
      setAuthReady(true);
    }
  }, [authReady]);

  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
        <Routes>
          <Route
            path="/"
            element={
              authReady ? (
                <Navigate to={token ? "/app/dashboard" : "/auth/login"} replace />
              ) : (
                <div style={{ padding: 24 }}>Loading...</div>
              )
            }
          />

          <Route path="/auth/*" element={<AuthLayout />}>
            <Route path="login" element={<Login onAuthed={setToken} />} />
            <Route path="forgot" element={<Forgot />} />
          </Route>

          <Route path="/oauth/callback" element={<OAuthCallback onAuthed={setToken} />} />

          <Route
            path="/app/*"
            element={
              <Protected authed={!!token} ready={authReady}>
                <AppLayout />
              </Protected>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="subject-open" element={<SubjectOpenList />} />
            <Route path="subjects" element={<SubjectOpen />} />
            <Route path="subject-list" element={<SubjectList />} />
            <Route path="training-program" element={<TrainingProgram />} />
            <Route path="admin/training-program" element={<AdminTrainingProgram />} />
            <Route path="admin/subject-open" element={<AdminSubjectOpen />} />
            <Route path="tuition" element={<TuitionPayments />} />
            <Route path="students" element={<StudentList />} />
            <Route path="students/:student_id" element={<StudentProfile />} />
          </Route>

          <Route path="*" element={<div style={{ padding: 24 }}>404 - Not Found</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
