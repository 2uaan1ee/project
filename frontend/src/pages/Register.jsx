import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

export default function Register() {
    const nav = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [agree, setAgree] = useState(true);        // mặc định tick
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const location = useLocation();
    const path = location.pathname; // ví dụ: "/auth/login"

    const submit = async (e) => {
        e.preventDefault(); if (loading || !agree) return;
        setMsg(""); setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type":"application/json" },
                body: JSON.stringify({ name, email, password })
        }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Register failed");
    // ✅ Đăng ký OK → quay lại trang đăng nhập
    nav("/auth/login", { replace: true });
    } catch (e) { setMsg(e.message); } 
    finally { setLoading(false); }
};

return (
    <div className="auth__root">
        <section className="auth__left">
            <div className="auth__leftOverlay"/>
            <div className="auth__leftContent">
            <div className="auth__brand"><img src="/img/logo_uit.svg" alt="UIT Logo" className="auth__logo logo-hover" /><span>UIT</span></div>
            <h1>Học sáng tạo, trải nghiệm, Sống trách nhiệm, yêu thương!</h1>
            <div className="auth__dots">
                <span className={path.includes("/login") ? "active" : ""} />
                <span className={path.includes("/register") ? "active" : ""} />
                <span className={path.includes("/forgot") ? "active" : ""} />
            </div>

            </div>
        </section>

        <section className="auth__right">
            <div className="auth__card">
            <h2>Create An Account</h2>
            <p className="auth__hint">Already have an account? <Link className="auth__link" to="/auth/login">Login</Link></p>

            <form onSubmit={submit} className="auth__form">
                <div className="auth__field">
                <label>Full Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
                </div>

                <div className="auth__field">
                <label>Email Address</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
                </div>

                <div className="auth__field">
                <label>Password</label>
                <div className="auth__pw">
                    <input type={showPw?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Input your password"/>
                    <button type="button" className="auth__eye" onClick={()=>setShowPw(s=>!s)}>{showPw?"🙈":"👁️"}</button>
                </div>
                </div>

                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:14,color:"#374151"}}>
                <input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} />
                <span>By clicking Create account, I agree that I have read and accepted the <a className="auth__link" href="#">Terms of Use</a> and <a className="auth__link" href="#">Privacy Policy</a>.</span>
                </label>

                {msg && <div className="auth__msg">{msg}</div>}
                <button className="btn btn--primary" type="submit" disabled={loading || !agree}>
                {loading ? "Creating..." : "Create"}
                </button>
            </form>
            </div>
        </section>
    </div>
  );
}
