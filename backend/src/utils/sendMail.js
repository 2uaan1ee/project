import nodemailer from "nodemailer";

let cachedTransporter;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Missing SMTP config. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

export async function sendMail({ to, subject, html, text }) {
  if (!to || !subject || (!html && !text)) {
    throw new Error("sendMail: missing to/subject/content");
  }
  const transporter = getTransporter();
  const from = process.env.MAIL_FROM || "UIT Auth <no-reply@uit.edu.vn>";

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: text || (html ? html.replace(/<[^>]+>/g, "") : ""),
    html,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("📧 Mail queued:", info.messageId);
  }
}
