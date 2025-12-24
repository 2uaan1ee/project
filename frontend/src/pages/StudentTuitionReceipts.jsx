// frontend/src/pages/StudentTuitionReceipts.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/students.css";
import "../styles/tuition_receipts.css";
import { apiFetch } from "../utils/apiFetch";

const MAJOR_LABELS = {
    TTNT: "Trí tuệ Nhân tạo",
    ATTT: "An toàn Thông tin",
    KHMT: "Khoa học Máy tính",
    MMTT: "Mạng máy tính & Truyền thông Dữ liệu",
    TKVM: "Thiết kế Vi mạch",
    KHDL: "Khoa học Dữ liệu",
    KTPM: "Kỹ thuật Phần mềm",
    TTDPT: "Truyền thông Đa phương tiện",
    KTMT: "Kỹ thuật Máy tính",
    CNTT: "Công nghệ Thông tin",
    HTTT: "Hệ thống Thông tin",
    TMDT: "Thương mại Điện tử",
};

function normalizeMajorIds(majorId) {
    if (!majorId) return [];
    if (Array.isArray(majorId)) return majorId.map((id) => String(id).trim()).filter(Boolean);
    const code = String(majorId).trim();
    return code ? [code] : [];
}
function formatMajor(majorId) {
    const ids = normalizeMajorIds(majorId);
    if (!ids.length) return "";
    return ids.map((code) => MAJOR_LABELS[code] || code).join(", ");
}

function toVnd(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "";
    return x.toLocaleString("vi-VN") + " ₫";
}
function formatDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("vi-VN");
}

export default function StudentTuitionReceipts() {
    const nav = useNavigate();
    const { studentId } = useParams();

    const [student, setStudent] = useState(null);
    const [identity] = useState({ identity_number: "" });
    const [groups, setGroups] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const abortRef = useRef(null);
    const majorDisplay = useMemo(() => formatMajor(student?.major_id), [student?.major_id]);

    const fetchAll = async () => {
        abortRef.current?.abort?.();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError("");

        try {
            // 1) student profile
            const sRes = await apiFetch(`/students/${encodeURIComponent(studentId)}`, {
                signal: controller.signal,
            });
            if (sRes.status === 401) {
                setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                nav("/auth/login", { replace: true });
                return;
            }
            if (!sRes.ok) throw new Error(`Load student failed (${sRes.status})`);
            const sData = await sRes.json();
            setStudent(sData);

            // 2) grouped receipts
            const rRes = await apiFetch(`/tuition-payments/student/${encodeURIComponent(studentId)}`, {
                signal: controller.signal,
            });
            if (rRes.status === 401) {
                setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                nav("/auth/login", { replace: true });
                return;
            }
            if (!rRes.ok) throw new Error(`Load receipts failed (${rRes.status})`);
            const rData = await rRes.json();
            setGroups(Array.isArray(rData?.items) ? rData.items : []);
        } catch (e) {
            if (e?.name === "AbortError") return;
            console.error("[tuition-receipts] error", e);
            setError("Website hiện tại đang quá tải...");
            setStudent(null);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    return (
        <div className="student-page tuition-bg">
            <div className="profile-toolbar" style={{ marginBottom: 16 }}>
                <button className="profile-back" type="button" style={{ paddingTop: "16px" }} onClick={() => nav("/app/tuition-list")}>
                    ← Quay về danh sách
                </button>
            </div>

            {error ? (
                <div className="student-card" style={{ padding: 18, color: "#b91c1c" }}>
                    {error}
                </div>
            ) : (
                <>
                    {/* HERO */}
                    {student && (
                        <div className="profile-hero student-card" style={{ padding: 0, border: "none", boxShadow: "none" }}>
                            <div className="profile-hero__block">
                                <span className="profile-hero__label">Mã số sinh viên (MSSV)</span>
                                <span className="profile-hero__value">{student.student_id}</span>
                                <div className="profile-meta">
                                    <span className="meta-pill">CCCD: {identity.identity_number || ""}</span>
                                    <span className="meta-pill">Lớp sinh hoạt: {student.class_id || ""}</span>
                                    <span className="meta-pill">
                                        Chương trình đào tạo: {student.program_type || student.program_id || ""}
                                    </span>
                                </div>
                            </div>

                            <div className="profile-hero__block">
                                <span className="profile-hero__label">Họ và tên</span>
                                <span className="profile-hero__value">{student.name}</span>
                                <span>Ngày sinh: {student.birth_date || ""}</span>
                                <span>Nơi sinh: {student.birthplace || ""}</span>
                            </div>

                            <div className="profile-hero__block">
                                <span className="profile-hero__label">Ngành học</span>
                                <span className="profile-hero__value">{majorDisplay || student.major_id || ""}</span>
                                <span>
                                    Giới tính:{" "}
                                    {student.gender === "Male" ? "Nam" : student.gender === "Female" ? "Nữ" : student.gender || ""}
                                </span>
                                <span>Đào tạo: {student.program_type || ""}</span>
                            </div>
                        </div>
                    )}

                    <div className="student-card" style={{ marginTop: 14 }}>
                        <div className="student-list__header" style={{ paddingBottom: 6 }}>
                            <div>
                                <p className="status-chip" style={{ margin: 0 }}>
                                    Phiếu thu học phí (KHSC)
                                </p>
                                <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>
                                    Mỗi thẻ là 1 phiếu thu học phí đăng ký học phần. Bên trong (có thể) có nhiều lần đóng.
                                </p>
                            </div>

                            <div style={{ color: "#64748b", fontSize: 13 }}>
                                {loading ? "Đang tải..." : `Tổng: ${groups.length} phiếu`}
                            </div>
                        </div>

                        <div className="khsc-feed">
                            {!loading && groups.length === 0 && (
                                <div style={{ padding: 16, color: "#64748b", textAlign: "center" }}>
                                    Không có phiếu thu.
                                </div>
                            )}

                            {groups.map((g) => {
                                const regNo = g.registration_no || g.registration_key || "—";
                                const ay = g.academic_year;
                                const sem = g.semester_label || (g.semester != null ? `HK${g.semester}` : "");
                                const last = g.last_paid_at ? formatDate(g.last_paid_at) : "";

                                return (
                                    <article key={`${regNo}-${ay}-${sem}`} className="khsc-post">
                                        <div className="khsc-post-head">
                                            <div className="khsc-org">
                                                <img className="khsc-logo" src="/img/logo_uit_transparent.png" alt="UIT" />
                                                <div>
                                                    <div className="khsc-org-name">Trường Đại học Công nghệ Thông tin</div>
                                                    <div className="khsc-org-sub">
                                                        {ay ? `${ay}` : ""} {sem ? `• ${sem}` : ""} {last ? `• Cập nhật: ${last}` : ""}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="khsc-tag">KHSC</div>
                                        </div>

                                        <div className="khsc-paper">
                                            <img className="khsc-watermark" src="/img/logo_uit_transparent.png" alt="" />
                                            <div className="khsc-title">PHIẾU THU HỌC PHÍ</div>

                                            <div className="khsc-grid">
                                                <div className="khsc-row">
                                                    <div className="khsc-k">Số phiếu (theo ĐKHP):</div>
                                                    <div className="khsc-v">{regNo}</div>
                                                </div>
                                                <div className="khsc-row">
                                                    <div className="khsc-k">Mã số sinh viên:</div>
                                                    <div className="khsc-v">{studentId}</div>
                                                </div>
                                                <div className="khsc-row">
                                                    <div className="khsc-k">Tổng học phí:</div>
                                                    <div className="khsc-v">{toVnd(g.tuition_total)}</div>
                                                </div>
                                                <div className="khsc-row">
                                                    <div className="khsc-k">Đã đóng:</div>
                                                    <div className="khsc-v">{toVnd(g.total_paid)}</div>
                                                </div>
                                                <div className="khsc-row">
                                                    <div className="khsc-k">Còn lại:</div>
                                                    <div className="khsc-v">{toVnd(g.remaining_balance)}</div>
                                                </div>
                                            </div>

                                            <div className="khsc-note">
                                                <b>Lưu ý:</b> Khi sinh viên đóng tiền, phiếu thu sẽ được cập nhật tự động lên hệ thống. Nếu có bất cứ lỗi nào, hãy liên hệ phòng Đào tạo để được hỗ trợ.
                                            </div>
                                        </div>

                                        <div className="khsc-payments">
                                            <div className="khsc-payments-title">Các lần đóng</div>

                                            {(g.payments || [])
                                                .slice()
                                                .sort((a, b) => (a.payment_sequence ?? 0) - (b.payment_sequence ?? 0))
                                                .map((p) => (
                                                    <div key={p._id} className="khsc-payline">
                                                        <div className="khsc-payline-left">
                                                            <div className="khsc-payline-seq">Lần {p.payment_sequence ?? "-"}</div>
                                                            <div className="khsc-payline-date">{formatDate(p.paid_at)}</div>
                                                            <div className="khsc-payline-receipt">
                                                                Mã phiếu: {p.receipt_number || p._id}
                                                            </div>
                                                        </div>

                                                        <div className="khsc-payline-right">
                                                            <div className="khsc-payline-amt">{toVnd(p.amount_paid)}</div>
                                                            <div className="khsc-payline-rem">
                                                                Còn: {toVnd(p.remaining_balance)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
