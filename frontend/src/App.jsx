import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { clearToken } from "./lib/auth";           // ⬅️ import tương đối (Cách 1)
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Forgot from "./pages/Forgot";
import OAuthCallback from "./pages/OAuthCallback";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile   = lazy(() => import("./pages/Profile"));

function Protected({ authed, children }) {
  return authed ? children : <Navigate to="/auth/login" replace />;
}


function Shell({ token, logout, children }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const isAuthRoute = pathname.startsWith("/auth");
  return (
    <>
      {!isAuthRoute && (
        <header style={{display:"flex",gap:12,padding:12,borderBottom:"1px solid #eee"}}>
          <Link to="/app/dashboard">Dashboard</Link>
          <Link to="/app/profile">Profile</Link>
          {token && (
            <button onClick={() => { logout(); nav("/auth/login", { replace: true }); }}>
              Log out
            </button>
          )}
        </header>
      )}
      {children}
    </>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  useEffect(() => {
    token ? localStorage.setItem("token", token) : localStorage.removeItem("token");
  }, [token]);

  const logout = () => {
    clearToken();     // ⬅️ xoá localStorage
    setToken("");     // ⬅️ đồng bộ state để Protected chặn /app/*
  };

  return (
    <BrowserRouter>
      <Shell token={token} logout={logout}>
        <Suspense fallback={<div style={{padding:24}}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to={token ? "/app/dashboard" : "/auth/login"} replace />} />
          <Route path="/auth/login"  element={token ? <Navigate to="/app/dashboard" replace /> : <Login onAuthed={setToken} />} />
          <Route path="/auth/forgot" element={token ? <Navigate to="/app/dashboard" replace /> : <Forgot />} />
          <Route path="/oauth/callback" element={<OAuthCallback onAuthed={setToken} />} />
          <Route path="/app" element={<Protected authed={!!token}><AppLayout/></Protected>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile"   element={<Profile />} />
          </Route>
          <Route path="*" element={<div style={{padding:24}}>404</div>} />
        </Routes>
        </Suspense>
      </Shell>
    </BrowserRouter>
  );
}
