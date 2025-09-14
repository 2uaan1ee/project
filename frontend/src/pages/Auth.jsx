import { useState } from "react";

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setMsg("");
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { name, email, password };
    try {
      const res = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      localStorage.setItem("token", data.token);
      onAuthed?.(data.token);
    } catch (e) { setMsg(e.message); }
  };

  return (
    <div style={{padding:24, maxWidth:360, margin:"40px auto"}}>
      <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
      <form onSubmit={submit} style={{display:"grid",gap:12}}>
        {mode==="register" && <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />}
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        {msg && <div style={{color:"crimson"}}>{msg}</div>}
        <button type="submit">{mode==="login"?"Sign in":"Create account"}</button>
      </form>
      <button style={{marginTop:8}} onClick={()=>setMode(mode==="login"?"register":"login")}>
        {mode==="login"?"Create an account":"Have an account? Sign in"}
      </button>
    </div>
  );
}
