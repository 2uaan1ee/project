import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";

function Protected({ authed, children }) {
  return authed ? children : <Navigate to="/auth" replace />;
}

export default function App(){
  const [token,setToken]=useState(()=>localStorage.getItem("token")||"");
  useEffect(()=>{ token?localStorage.setItem("token",token):localStorage.removeItem("token"); },[token]);
  const logout=()=>setToken("");

  return (
    <BrowserRouter>
      <header style={{display:"flex",gap:12,padding:12,borderBottom:"1px solid #eee"}}>
        <Link to="/">Home</Link>
        {token && <>
          <Link to="/app/dashboard">Dashboard</Link>
          <Link to="/app/profile">Profile</Link>
          <button onClick={logout}>Log out</button>
        </>}
        {!token && <Link to="/auth">Sign in</Link>}
      </header>
      <Routes>
        <Route path="/" element={<Navigate to={token?"/app/dashboard":"/auth"} replace />} />
        <Route path="/auth" element={token?<Navigate to="/app/dashboard" replace />:<Auth onAuthed={setToken} />} />
        <Route path="/app/dashboard" element={<Protected authed={!!token}><Dashboard/></Protected>} />
        <Route path="/app/profile"   element={<Protected authed={!!token}><Profile/></Protected>} />
        <Route path="*" element={<div style={{padding:24}}>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}
