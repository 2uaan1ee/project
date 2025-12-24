// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState, lazy, Suspense, useCallback } from "react";

import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";

import Login from "./pages/Login";
import Forgot from "./pages/Forgot";
import OAuthCallback from "./pages/OAuthCallback";

import StudentList from "./pages/StudentList.jsx";
import StudentProfile from "./pages/StudentProfile.jsx";

import SubjectOpen from "./pages/SubjectOpen.jsx";
import SubjectList from "./pages/SubjectList.jsx";
import AllSubjectList from "./pages/AllSubjectList.jsx";
import SubjectOpenList from "./pages/SubjectOpenList.jsx";
import TrainingProgram from "./pages/TrainingProgram.jsx";
import TuitionPayments from "./pages/TuitionPayments.jsx";
import AdminTrainingProgram from "./pages/AdminTrainingProgram.jsx";
import AdminSubjectOpen from "./pages/AdminSubjectOpen.jsx";
import RegulationSettings from "./pages/RegulationSettings.jsx";

import StudentListTuition from "./pages/StudentListTuition.jsx";
import StudentTuitionReceipts from "./pages/StudentTuitionReceipts.jsx"; // ✅ thêm
import CourseRegistrations from "./pages/CourseRegistrations.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));

function Protected({ authed, ready, children }) {
  if (!ready) return <div style={{ padding: 24 }}>Loading...</div>;
  return authed ? children : <Navigate to="/auth/login" replace />;
}

function decodeAndStoreUserInfo(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64));

    if (payload.role) sessionStorage.setItem("user_role", payload.role);
    if (payload.email) sessionStorage.setItem("user_email", payload.email);
  } catch (e) {
    console.warn("Failed to decode token:", e);
  }
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("token") || "");
  const [authReady, setAuthReady] = useState(false);

  /**
   * ✅ onAuthed: điểm duy nhất để set token
   * - set state
   * - sync sessionStorage
   * - decode role/email
   */
  const onAuthed = useCallback((newToken) => {
    const t = String(newToken || "");
    if (!t) {
      setToken("");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user_role");
      sessionStorage.removeItem("user_email");
      return;
    }
    setToken(t);
    sessionStorage.setItem("token", t);
    decodeAndStoreUserInfo(t);
  }, []);

  // ✅ Attempt silent refresh on first load (if refresh cookie exists)
  useEffect(() => {
    let cancelled = false;

    const tryRefresh = async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST", // nếu BE là GET thì đổi ở đây
          credentials: "include",
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!cancelled && data?.token) {
          onAuthed(data.token);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };

    tryRefresh();

    return () => {
      cancelled = true;
    };
  }, [onAuthed]);

  // ✅ Nếu refresh fail nhưng sessionStorage đã có token (F5), vẫn cho app chạy
  useEffect(() => {
    if (authReady) return;
    if (sessionStorage.getItem("token")) setAuthReady(true);
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
            <Route path="login" element={<Login onAuthed={onAuthed} />} />
            <Route path="forgot" element={<Forgot />} />
          </Route>

          <Route path="/oauth/callback" element={<OAuthCallback onAuthed={onAuthed} />} />

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
            <Route path="all-subjects" element={<AllSubjectList />} />

            <Route path="training-program" element={<TrainingProgram />} />
            <Route path="admin/training-program" element={<AdminTrainingProgram />} />
            <Route path="admin/subject-open" element={<AdminSubjectOpen />} />

            <Route path="regulations" element={<RegulationSettings />} />
            <Route path="tuition" element={<TuitionPayments />} />

            <Route path="students" element={<StudentList />} />
            <Route path="students/:student_id" element={<StudentProfile />} />

            {/* ✅ Tuition list + detail */}
            <Route path="tuition-list" element={<StudentListTuition />} />
            <Route path="tuition-list/:studentId" element={<StudentTuitionReceipts />} />

            {/* ✅ Course Registrations - Admin only */}
            <Route path="admin/course-registrations" element={<CourseRegistrations />} />
          </Route>

          <Route path="*" element={<div style={{ padding: 24 }}>404 - Not Found</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
