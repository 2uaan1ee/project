import "../styles/dashboard.css";

function MiniChart({ data = [2, 4, 3, 5, 4, 5, 3] }) {
  // vẽ path svg đơn giản
  const w = 280, h = 120, pad = 10;
  const max = Math.max(...data) || 1;
  const stepX = (w - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y];
  });
  const d = points.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart">
      <path d={d} />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" />
      ))}
    </svg>
  );
}

function ProgressRing({ value = 50 }) {
  // vòng tròn progress bằng conic-gradient
  return (
    <div className="ring">
      <div className="ring__pie" style={{ "--val": `${value}%` }} />
      <div className="ring__center">
        <div className="ring__value">{value}%</div>
        <div className="ring__label">Course</div>
      </div>
    </div>
  );
}

const mentors = [
  {
    name: "Lincoln George",
    title: "UI/UX · Design",
    avatar: "/img/avatar_1.jpg",
    courses: 100,
    rating: "4.5 (1.2k)",
  },
  {
    name: "Gustavo Torff",
    title: "UI/UX · Design",
    avatar: "/img/avatar_2.jpg",
    courses: 100,
    rating: "4.5 (1.2k)",
    followed: true,
  },
];

const courses = [
  {
    thumb: "/img/course_1.jpg",
    title: "Creating Beautiful Landing Page in 1 Hour",
    level: "Beginner",
    author: "Lincoln George",
    rating: "4.5",
  },
  {
    thumb: "/img/course_2.jpg",
    title: "Animation is the Key of Successful UI/UX Design",
    level: "Master",
    author: "Emerson Siphon",
    rating: "4.5",
  },
];

export default function Dashboard() {
  return (
    <div className="dash">
      {/* Sidebar */}
      <aside className="dash__sidebar">
        <div className="brand">
          <img src="/img/logo_uit.svg" alt="logo" />
          <span>Coursea</span>
        </div>

        <nav className="nav">
          <a className="nav__item active">
            <i>🏠</i> Overview
          </a>
          <a className="nav__item"><i>📚</i> Courses</a>
          <a className="nav__item"><i>👨‍🏫</i> Mentors</a>
          <a className="nav__item"><i>💬</i> Message</a>
          <a className="nav__item"><i>⚙️</i> Setting</a>
        </nav>

        <div className="cta">
          <div className="cta__title">Upgrade to Pro</div>
          <div className="cta__sub">Get 1 Month Free!</div>
          <img src="/img/rocket.png" alt="rocket" />
        </div>
      </aside>

      {/* Main */}
      <main className="dash__main">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <h1>Hi, Pristia</h1>
            <p>Let’s learn something new today!</p>
          </div>
          <div className="topbar__actions">
            <button title="Search">🔎</button>
            <button title="Notifications">🔔</button>
            <img className="avatar" src="/img/avatar_me.jpg" alt="me" />
          </div>
        </header>

        {/* Stats Row */}
        <section className="grid2">
          <div className="card card--dark">
            <div className="card__title">Running Course</div>
            <div className="running">
              <div className="running__big">50</div>
              <ProgressRing value={50} />
            </div>
          </div>

          <div className="card">
            <div className="card__title">Activity <span className="pill">3.5 Hours</span></div>
            <MiniChart data={[2, 3, 2.5, 4, 2.5, 3.8, 3.2]} />
            <div className="axis">
              {["S","M","T","W","T","F","S"].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
        </section>

        {/* Monthly Mentors */}
        <section>
          <h3 className="section__title">Monthly Mentors</h3>
          <div className="grid2">
            {mentors.map((m, idx) => (
              <div className="card mentor" key={idx}>
                <img className="mentor__avatar" src={m.avatar} alt={m.name} />
                <div className="mentor__meta">
                  <div className="mentor__name">{m.name}</div>
                  <div className="muted">{m.title}</div>
                  <div className="mentor__stats">
                    <span>📘 {m.courses} Course</span>
                    <span>⭐ {m.rating}</span>
                  </div>
                </div>
                <button className={"btn " + (m.followed ? "btn--muted" : "btn--ghost")}>
                  {m.followed ? "Followed" : "+ Follow"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Monthly Course */}
        <section>
          <h3 className="section__title">Monthly Course</h3>
          <div className="grid2">
            {courses.map((c, idx) => (
              <article className="card course" key={idx}>
                <div className="course__thumb">
                  <img src={c.thumb} alt={c.title} />
                  <span className="badge">{c.level}</span>
                </div>
                <div className="course__body">
                  <h4 className="course__title">{c.title}</h4>
                  <div className="course__meta">
                    <span>👤 {c.author}</span>
                    <span>⭐ {c.rating}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Right column */}
      <aside className="dash__aside">
        <div className="card cal">
          <div className="cal__top">
            <button>‹</button>
            <div className="cal__month">April 2022</div>
            <button>›</button>
          </div>
          <div className="cal__days">
            {["S","M","T","W","T","F","S"].map((d,i) => <span key={i} className="muted">{d}</span>)}
            {Array.from({ length: 30 }).map((_, i) => (
              <button key={i} className={"day " + (i===13 ? "active" : "")}>{i+1}</button>
            ))}
          </div>
        </div>

        <div className="card detail">
          <div className="detail__hero">
            <img src="/img/ux_room.jpg" alt="UX Session"/>
            <span className="badge badge--gray">Beginner</span>
          </div>
          <h4>UX Design: How To Implement Usability Testing</h4>
          <div className="detail__meta">
            <span>👨‍🏫 Alfredo Rhiel Madsen</span>
            <span>👥 500 Student</span>
            <span>📂 5 Modul</span>
            <span>⏱️ 1h 30m</span>
          </div>

          <div className="detail__list">
            {[
              "Introduction",
              "What is UX Design",
              "Usability Testing",
              "Create Usability Test",
              "How to Implement",
            ].map((t, i) => (
              <div className="detail__row" key={i}>
                <div className="dot" />
                <span>{i+1}. {t}</span>
                <span className="muted">10:00</span>
              </div>
            ))}
          </div>

          <button className="btn btn--primary btn--full">Go To Detail</button>
        </div>
      </aside>
    </div>
  );
}
