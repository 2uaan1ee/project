import { useState } from "react";
import "../styles/calendar.css";

export default function CalendarWidget() {
  const today = new Date();

  // Khởi tạo với tháng/năm hiện tại
  const [month, setMonth] = useState(() => today.getMonth());
  const [year, setYear] = useState(() => today.getFullYear());

  // Ngày có sự kiện (ví dụ)
  const events = [8, 10, 11, 18];

  // Số ngày trong tháng
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Thứ của ngày đầu tiên trong tháng (0 = Chủ nhật, 1 = Thứ 2, ...)
  const firstDay = new Date(year, month, 1).getDay();

  // Chuyển sang dạng: Thứ 2 = 0, ..., Chủ nhật = 6
  const startOffset = (firstDay + 6) % 7;

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div className="calendar-container">
      <h3 className="calendar-title">Lịch</h3>

      {/* HEADER */}
      <div className="calendar-header-row">
        <span className="nav-btn" onClick={handlePrev}>
          Tháng trước
        </span>

        <div className="month-year">
          Tháng {month + 1}
          <br />
          <b>{year}</b>
        </div>

        <span className="nav-btn" onClick={handleNext}>
          Tháng sau
        </span>
      </div>

      {/* Tên thứ */}
      <div className="calendar-grid week">
        <div>T2</div>
        <div>T3</div>
        <div>T4</div>
        <div>T5</div>
        <div>T6</div>
        <div>T7</div>
        <div>CN</div>
      </div>

      {/* Ngày */}
      <div className="calendar-grid">
        {/* khoảng trống đầu tháng */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={"blank-" + i}></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hasEvent = events.includes(day);

          return (
            <div
              key={day}
              className={`day ${isToday(day) ? "today" : ""}`}
            >
              {day}
              {hasEvent && !isToday(day) && <div className="dot"></div>}
            </div>
          );
        })}
      </div>

      <div className="calendar-footer">
        <a
          href="https://student.uit.edu.vn/kehoachnam"
          target="_blank"
          rel="noreferrer"
        >
          Lịch năm
        </a>{" "}
        &nbsp;|&nbsp; <a href="#">Quản lý theo dõi</a>
      </div>
    </div>
  );
}
