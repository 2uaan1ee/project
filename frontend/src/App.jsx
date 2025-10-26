// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import React, { useEffect, useState, lazy, Suspense } from "react";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import Login from "./pages/Login";
import Forgot from "./pages/Forgot";
import OAuthCallback from "./pages/OAuthCallback";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile   = lazy(() => import("./pages/Profile"));

function Protected({ authed, children }) {
  return authed ? children : <Navigate to="/auth/login" replace />;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    token ? localStorage.setItem("token", token) : localStorage.removeItem("token");
  }, [token]);

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
          </Route>

          <Route path="*" element={<div style={{ padding: 24 }}>404 - Not Found</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
