import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/app-footer.css";
import "../styles/app-footer.css";

export default function AppFooter() {
    const nav = useNavigate();
    const { pathname } = useLocation();
    const year = new Date().getFullYear();

    const links = [
        { label: "Trang chủ", to: "/app/dashboard" },
        { label: "Môn học mở", to: "/app/subject-open" },
        { label: "Sinh viên", to: "/app/students" },
    ];

    return (
        <footer className="app-footer" role="contentinfo">
            <div className="app-footer__inner">
                <div className="app-footer__left">
                    <div className="app-footer__brand">
                        <img className="app-footer__logo" src="/img/logo_uit.svg" alt="UIT" />
                        <div>
                            <div className="app-footer__title">Trường Đại học Công nghệ Thông tin</div>
                            <div className="app-footer__sub">
                                © {year} — Hệ thống quản lý học vụ (demo)
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="app-footer__nav" aria-label="Footer navigation">
                    {links.map((x) => (
                        <button
                            key={x.to}
                            type="button"
                            className={`app-footer__link ${pathname === x.to ? "is-active" : ""}`}
                            onClick={() => nav(x.to)}
                        >
                            {x.label}
                        </button>
                    ))}
                </nav>

                <div className="app-footer__right">
                    <a className="app-footer__meta" href="mailto:support@uit.edu.vn">
                        support@uit.edu.vn
                    </a>
                    <span className="app-footer__dot">•</span>
                    <span className="app-footer__meta">Phiên bản 1.0.0</span>
                </div>
            </div>
        </footer>
    );
}
