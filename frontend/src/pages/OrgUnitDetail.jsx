// src/pages/OrgUnitDetail.jsx
import { useLocation, useParams } from "react-router-dom";

export default function OrgUnitDetail() {
    const { id } = useParams();
    const { state } = useLocation(); // nhận unit info từ Dashboard

    return (
        <div style={{ padding: 20 }}>
            <h1>🏢 {state?.title || "Đơn vị"}</h1>
            <p style={{ opacity: 0.75 }}>ID: {id}</p>
            {state?.subtitle ? <p>{state.subtitle}</p> : null}

            <div style={{ marginTop: 16 }}>
                <button>💬 Nhắn tin</button>
                <button style={{ marginLeft: 10 }}>📅 Đặt lịch họp</button>
            </div>
        </div>
    );
}
