import { Outlet, Link, useNavigate } from "react-router-dom";

export default function AppLayout() {
  const nav = useNavigate();
  return (
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",minHeight:"100vh"}}>
      <aside style={{borderRight:"1px solid #eee",padding:16}}>
        <h3>MyApp</h3>
        <ul style={{listStyle:"none",padding:0,display:"grid",gap:8}}>
          <li><Link to="/app/dashboard">Dashboard</Link></li>
          <li><Link to="/app/profile">Profile</Link></li>
        </ul>
        <button style={{marginTop:12}} onClick={() => nav("/app/dashboard")}>
          Go Dashboard
        </button>
      </aside>
      <main style={{padding:24}}>
        <Outlet />
      </main>
    </div>
  );
}
