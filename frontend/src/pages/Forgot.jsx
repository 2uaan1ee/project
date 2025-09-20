import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Forgot() {
    const [email, setEmail] = useState("");
    const [captcha, setCaptcha] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const path = location.pathname; // ví dụ: "/auth/login"

    const submit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setMsg("");
        setLoading(true);
        try {
        // TODO: gọi API forgot password của bạn tại đây
            const res = await fetch("/api/auth/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, captcha }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Request failed");
                setMsg("📩 Reset link sent to your email");
            } catch (err) {
                setMsg(err.message);
            } finally {
                setLoading(false);
            }
};

return (
    <div className="auth__root">
        <section className="auth__left">
            <div className="auth__leftOverlay" />
            <div className="auth__leftContent">
            <div className="auth__brand">
                <img src="/img/logo_uit.svg" alt="UIT Logo" className="auth__logo logo-hover" />
                <span>UIT</span>
            </div>
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
            <h2>Forgot Password</h2>
            <p className="auth__hint">
                Back to{" "}
                <Link to="/auth/login" className="auth__link">
                Sign In
                </Link>
            </p>

            <form onSubmit={submit} className="auth__form">
                <div className="auth__field">
                <label>Email Address</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                />
                </div>

                <div className="auth__field">
                <label>Captcha</label>
                <input required
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    placeholder="Type the security code"
                />
                </div>

                {msg && <div className="auth__msg">{msg}</div>}

                <button
                className="btn btn--primary"
                type="submit"
                disabled={loading}
                >
                {loading ? "Sending..." : "Send Reset Link"}
                </button>
            </form>
            </div>
        </section>
    </div>
  );
}
