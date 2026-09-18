import nodemailer from "nodemailer";

const SMTP_NETWORK_CODES = new Set([
  "ETIMEDOUT",
  "ESOCKET",
  "ECONNECTION",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETLS",
  "EDNS",
  "EENVELOPE",
]);

export const mailNotConfiguredMessage =
  "Email is not configured. On Render's free plan, Gmail SMTP is blocked — set RESEND_API_KEY instead.";

export const renderSmtpBlockedMessage =
  "Render's free plan blocks Gmail SMTP (ports 465/587). Add RESEND_API_KEY to send review replies.";

export function getMailTransport() {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_MAIL && process.env.SMTP_PASSWORD) return "smtp";
  return null;
}

export function describeMailError(error) {
  if (!error) return "Failed to send email";
  if (error.code === "MAIL_NOT_CONFIGURED") return mailNotConfiguredMessage;
  if (error.code === "SMTP_BLOCKED") return renderSmtpBlockedMessage;
  if (error.code === "EAUTH") {
    return "Gmail rejected the SMTP login. Set SMTP_PASSWORD to a 16-character App Password (2-Step Verification must be on).";
  }
  if (SMTP_NETWORK_CODES.has(error.code) || process.env.RENDER) {
    return renderSmtpBlockedMessage;
  }
  return error.message || "Failed to send email";
}

export function statusForMailError(error) {
  if (error?.code === "MAIL_NOT_CONFIGURED" || error?.code === "SMTP_BLOCKED") {
    return 503;
  }
  return 500;
}

async function sendViaResend({ to, subject, text }, fetchImpl) {
  const from = process.env.MAIL_FROM || "Skyplate <beth.t@example.com>";
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || "Failed to send email via Resend");
    error.code = "RESEND_ERROR";
    throw error;
  }
}

async function sendViaSmtp({ to, subject, text }, createTransport) {
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const transporter = createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: (process.env.SMTP_PASSWORD || "").replace(/\s/g, ""),
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  await transporter.sendMail({
    from: `"Skyplate" <${process.env.SMTP_MAIL}>`,
    to,
    subject,
    text,
  });
}

export async function sendMail(
  { to, subject, text },
  { fetchImpl = fetch, createTransport = nodemailer.createTransport.bind(nodemailer) } = {},
) {
  const transport = getMailTransport();
  if (!transport) {
    const error = new Error(mailNotConfiguredMessage);
    error.code = "MAIL_NOT_CONFIGURED";
    throw error;
  }

  if (transport === "resend") {
    await sendViaResend({ to, subject, text }, fetchImpl);
    return { transport };
  }

  if (process.env.RENDER) {
    const error = new Error(renderSmtpBlockedMessage);
    error.code = "SMTP_BLOCKED";
    throw error;
  }

  await sendViaSmtp({ to, subject, text }, createTransport);
  return { transport };
}
