// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import Login from "./pages/Login";
import Forgot from "./pages/Forgot";
import OAuthCallback from "./pages/OAuthCallback";
import StudentList from "./components/StudentList.jsx";
import StudentProfile from "./components/StudentProfile.jsx";
import Curriculum from "./pages/Curriculum.jsx";
import CurriculumAdmin from "./pages/CurriculumAdmin.jsx";
import { AuthContext } from "./context/AuthContext.jsx";
import { decodeJwt } from "./lib/jwt.js";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile   = lazy(() => import("./pages/Profile"));

function Protected({ authed, children }) {
  return authed ? children : <Navigate to="/auth/login" replace />;
}

function RequireRole({ allow, children }) {
  const { user } = React.useContext(AuthContext);
  const roles = Array.isArray(allow) ? allow : [allow];
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to="/app/curriculum" replace />;
  }
  return children;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const user = useMemo(() => decodeJwt(token), [token]);

  useEffect(() => {
    token ? localStorage.setItem("token", token) : localStorage.removeItem("token");
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, user, setToken }}>
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
            <Route path="students" element={<StudentList />} />
            <Route path="students/:student_id" element={<StudentProfile />} />
                <Route path="curriculum" element={<Curriculum />} />
                <Route
                  path="curriculum/manage"
                  element={
                    <RequireRole allow={["admin"]}>
                      <CurriculumAdmin />
                    </RequireRole>
                  }
                />
          </Route>

          <Route path="*" element={<div style={{ padding: 24 }}>404 - Not Found</div>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
