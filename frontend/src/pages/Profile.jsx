import { useEffect, useState } from "react";
import { authFetch } from "../lib/auth";

export default function Profile() {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");
  useEffect(()=>{ (async()=>{
    try{
      const res = await authFetch("/api/me");
      const data = await res.json();
      if(!res.ok) throw new Error(data.message||"Failed");
      setMe(data);
    }catch(e){ setErr(e.message); }
  })(); },[]);
  if(err) return <div style={{color:"crimson"}}>{err}</div>;
  if(!me) return <div>Loading...</div>;
  return <pre style={{padding:24}}>{JSON.stringify(me, null, 2)}</pre>;
}
