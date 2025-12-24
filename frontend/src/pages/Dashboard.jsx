// src/pages/Dashboard.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/subject-open.css";
import CalendarWidget from "../components/CalendarWidget.jsx";

// ✅ đặt file json ở: src/data/uit_org_structure.json
import orgData from "../data/uit_org_structure.json";

function getNodeTitle(node) {
  return node?.name || node?.title || node?.label || "Không tên";
}

function getNodeChildren(node) {
  return Array.isArray(node?.children) ? node.children : [];
}

// Build index để: search + breadcrumb path
function buildIndex(root) {
  const byId = new Map(); // id -> { node, pathTitles, pathNodes, depth }
  function walk(node, pathNodes = [], depth = 0) {
    const id = node?.id || node?._id || `${depth}-${getNodeTitle(node)}`;
    const nextPathNodes = [...pathNodes, node];
    const pathTitles = nextPathNodes.map(getNodeTitle);

    byId.set(id, { id, node, pathTitles, pathNodes: nextPathNodes, depth });

    for (const child of getNodeChildren(node)) {
      walk(child, nextPathNodes, depth + 1);
    }
  }
  walk(root, [], 0);
  return byId;
}

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function Modal({ open, onClose, unit }) {
  if (!open || !unit) return null;

  const title = getNodeTitle(unit.node);
  const breadcrumb = unit.pathTitles.join("  ›  ");

  // Optional contact fields nếu sau này bạn bổ sung vào JSON
  const contacts = unit.node?.contacts || {};
  const phone = contacts.phone || unit.node?.phone;
  const email = contacts.email || unit.node?.email;
  const location = contacts.location || unit.node?.location;

  return (
    <div className="uit-modal-backdrop" onClick={onClose}>
      <div className="uit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="uit-modal-head">
          <div>
            <div className="uit-modal-breadcrumb">{breadcrumb}</div>
            <h2 className="uit-modal-title">{title}</h2>
          </div>
          <button className="uit-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="uit-modal-body">
          {/* Chỉ hiện nếu có dữ liệu */}
          {phone && <p>📞 {phone}</p>}
          {email && <p>✉️ {email}</p>}
          {location && <p>📍 {location}</p>}

          {!phone && !email && !location && (
            <p style={{ color: "#64748b" }}>
              (Chưa có thông tin liên hệ trong JSON. Bạn có thể thêm field{" "}
              <b>contacts</b> để hiện ở đây.)
            </p>
          )}
        </div>

        <div className="uit-modal-actions">
          <button
            className="uit-btn primary"
            onClick={() => alert("TODO: mở form đặt lịch họp")}
          >
            📅 Đặt lịch họp
          </button>
          <button
            className="uit-btn"
            onClick={() => alert("TODO: mở chat / nhắn tin")}
          >
            💬 Nhắn tin
          </button>
          <button
            className="uit-btn"
            onClick={() => alert("TODO: mở trang liên hệ / ticket")}
          >
            📨 Liên hệ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const userRole = sessionStorage.getItem("user_role") || "user";

  // ✅ root nằm ở orgData.root (đúng bug "Không tên" trước đó)
  const rootNode = useMemo(() => {
    if (orgData?.root) return orgData.root;
    // fallback nếu JSON là array
    if (Array.isArray(orgData)) {
      return { id: "UIT", name: "Trường Đại học Công nghệ Thông tin", children: orgData };
    }
    return orgData;
  }, []);

  const indexById = useMemo(() => buildIndex(rootNode), [rootNode]);

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null); // {id,node,pathTitles,...}
  const [openModal, setOpenModal] = useState(false);

  // Các nhánh cấp 1 dưới root (xổ luôn, không cần click để mở)
  const level1Groups = useMemo(() => getNodeChildren(rootNode), [rootNode]);

  // Filter theo search: lọc các “đơn vị” (depth >= 2) để ra card
  // Bạn có thể đổi rule nếu muốn depth khác
  const filteredCardsByGroup = useMemo(() => {
    const nq = normalize(q);

    return level1Groups.map((group) => {
      const groupTitle = getNodeTitle(group);

      // Card = children của group (depth=2)
      const cards = getNodeChildren(group)
        .map((child) => {
          const id = child?.id || child?._id || `${groupTitle}-${getNodeTitle(child)}`;
          const hit = nq
            ? normalize(getNodeTitle(child)).includes(nq)
            : true;

          // Nếu search, cho phép match cả ở “cháu” => vẫn hiện card cha
          let hitInDesc = false;
          if (nq && !hit) {
            const stack = [...getNodeChildren(child)];
            while (stack.length) {
              const x = stack.pop();
              if (normalize(getNodeTitle(x)).includes(nq)) {
                hitInDesc = true;
                break;
              }
              stack.push(...getNodeChildren(x));
            }
          }

          return { id, node: child, show: hit || hitInDesc };
        })
        .filter((x) => x.show);

      return { title: groupTitle, groupNode: group, cards };
    });
  }, [level1Groups, q]);

  function openUnit(unitId) {
    const info = indexById.get(unitId);
    // nếu không có id trong index (do id fallback), tự tạo info tối thiểu
    if (!info) {
      const found = { id: unitId, node: null, pathTitles: [unitId] };
      setSelected(found);
      setOpenModal(true);
      return;
    }
    setSelected(info);
    setOpenModal(true);
  }

  return (
    <div className="dashboard-layout cleaner">
      {/* Sidebar trái */}
      <aside className="subject-open-steps">
        <div className="step-brand">
          <img src="/img/logo_uit.svg" alt="Logo UIT" />
        </div>

        <h3 style={{ textAlign: "center", marginBottom: 6 }}>Trang chủ</h3>

        <ol>
          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/subject-list")}
          >
            <span className="step-number">1</span>
            Danh sách môn học
          </li>
          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/training-program")}
          >
            <span className="step-number">2</span>
            Chương trình đào tạo
          </li>

          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/subject-open")}
          >
            <span className="step-number">3</span>
            Môn học mở
          </li>

          <li>
            <span className="step-number">4</span>
            Lịch trình giảng dạy
          </li>

          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/students")}
          >
            <span className="step-number">5</span>
            Danh sách sinh viên
          </li>

          <li>
            <span className="step-number">6</span>
            Bảng điểm
          </li>

          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/tuition-list")}
          >
            <span className="step-number">7</span>
            Danh sách học phí
          </li>

          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/tuition")}
          >
            <span className="step-number">8</span>
            Tình trạng học phí
          </li>
          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/regulations")}
          >
            <span className="step-number">9</span>
            Thay đổi quy định
          </li>
          <li
            style={{ cursor: "pointer", color: "#2563eb" }}
            onClick={() => nav("/app/all-subjects")}
          >
            <span className="step-number">10</span>
            Điều chỉnh môn học
          </li>
        </ol>

        {/* Admin Section */}
        {userRole === "admin" && (
          <>
            <hr style={{ margin: "20px 0", border: "none", borderTop: "2px solid #fca5a5", opacity: 0.5 }} />
            <h3 style={{ textAlign: "center", marginBottom: 12, color: "#dc2626", fontSize: "16px" }}>
              🔐 Quản trị viên
            </h3>
            <ol style={{ counterReset: "admin-counter" }}>
              <li
                style={{
                  cursor: "pointer",
                  color: "#dc2626",
                  fontWeight: "600",
                  listStyle: "none"
                }}
                onClick={() => nav("/app/admin/training-program")}
              >
                <span className="step-number" style={{ background: "#dc2626" }}>🔑</span>
                Quản lý CT đào tạo
              </li>
              <li
                style={{
                  cursor: "pointer",
                  color: "#dc2626",
                  fontWeight: "600",
                  listStyle: "none"
                }}
                onClick={() => nav("/app/admin/subject-open")}
              >
                <span className="step-number" style={{ background: "#dc2626" }}>📚</span>
                Quản lý môn học mở
              </li>
              <li
                style={{
                  cursor: "pointer",
                  color: "#dc2626",
                  fontWeight: "600",
                  listStyle: "none"
                }}
                onClick={() => nav("/app/admin/course-registrations")}
              >
                <span className="step-number" style={{ background: "#dc2626" }}>📝</span>
                Quản lý Phiếu Đăng ký
              </li>
            </ol>
          </>
        )}

        <div className="step-footer">
          <button type="button">Like & Share</button>
          <span className="star-count">458 ⭐</span>
        </div>
      </aside>

      {/* Nội dung chính */}
      <main className="dashboard-content">
        <header className="topbar">
          <h1>🏢 Danh bạ phòng ban</h1>
        </header>

        {/* Root label + Search */}
        <section className="uit-directory-head">
          <h2 className="uit-root-title">{getNodeTitle(rootNode)}</h2>
          <p className="uit-subtitle">Chọn đơn vị để liên hệ / đặt lịch / nhắn tin.</p>

          <div className="uit-search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm phòng ban… (VD: Đào tạo, CTSV, Trung tâm...)"
            />
          </div>
        </section>

        {/* Render theo nhóm cấp 1, xổ hết ra */}
        <section className="uit-directory">
          {filteredCardsByGroup.map((g) => {
            if (!g.cards.length) return null;

            return (
              <div className="uit-group" key={g.title}>
                <h3 className="uit-group-title">{g.title}</h3>

                <div className="uit-cards">
                  {g.cards.map((c) => {
                    const title = getNodeTitle(c.node);
                    const children = getNodeChildren(c.node);

                    // “Dòng info” giống GV lý thuyết / HDTH:
                    // Ta hiển thị nhanh danh sách đơn vị con (nếu có)
                    const line1 =
                      children.length > 0
                        ? `Đơn vị trực thuộc: ${children
                          .slice(0, 3)
                          .map(getNodeTitle)
                          .join(", ")}${children.length > 3 ? "…" : ""}`
                        : "Đơn vị trực thuộc: (không có)";

                    const unitId =
                      c.node?.id ||
                      c.node?._id ||
                      `${g.title}-${title}`;

                    return (
                      <div
                        key={unitId}
                        className="uit-card"
                        onClick={() => openUnit(unitId)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && openUnit(unitId)}
                      >
                        <h4 className="uit-card-title">{title}</h4>

                        <p className="uit-card-line">
                          <b>📌 Nhánh:</b> {g.title}
                        </p>

                        <p className="uit-card-line">
                          <b>🏷️</b> {line1}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Sidebar phải */}
      <aside className="sidebar-right improved">
        <CalendarWidget />
        <div className="widget">
          <h4>🌐 Thành viên trực tuyến</h4>
          <p>96 người dùng</p>
        </div>
      </aside>

      {/* Modal */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        unit={selected}
      />
    </div >
  );
}
