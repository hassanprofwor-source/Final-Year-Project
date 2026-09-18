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
  "Email is not configured. On Render, set MAIL_WEBHOOK_URL to send review replies through Gmail.";

export const renderSmtpBlockedMessage =
  "Render's free plan blocks Gmail SMTP. Set MAIL_WEBHOOK_URL (Google Apps Script) to email customers, or use Resend only for your own inbox.";

function envValue(name) {
  return (process.env[name] || "").trim().replace(/^["']|["']$/g, "");
}

export function getMailTransport() {
  if (envValue("MAIL_WEBHOOK_URL")) return "webhook";
  if (envValue("RESEND_API_KEY")) return "resend";
  if (envValue("SMTP_MAIL") && envValue("SMTP_PASSWORD")) return "smtp";
  return null;
}

export function describeMailError(error) {
  if (!error) return "Failed to send email";
  if (error.code === "MAIL_NOT_CONFIGURED") return mailNotConfiguredMessage;
  if (error.code === "SMTP_BLOCKED") return renderSmtpBlockedMessage;
  if (error.code === "WEBHOOK_ERROR") return error.message || "Failed to send email via Gmail webhook";
  if (error.code === "RESEND_ERROR") return error.message || "Failed to send email via Resend";
  if (error.code === "EAUTH") {
    return "Gmail rejected the SMTP login. Set SMTP_PASSWORD to a 16-character App Password (2-Step Verification must be on).";
  }
  if (SMTP_NETWORK_CODES.has(error.code)) {
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

async function sendViaWebhook({ to, subject, text }, fetchImpl) {
  const url = envValue("MAIL_WEBHOOK_URL");
  const secret = envValue("MAIL_WEBHOOK_SECRET");
  if (!secret) {
    const error = new Error("MAIL_WEBHOOK_SECRET is missing. Set it to the same value as WEBHOOK_SECRET in the Google Apps Script.");
    error.code = "WEBHOOK_ERROR";
    throw error;
  }

  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ to, subject, text, secret }),
    redirect: "follow",
  });

  const raw = await response.text();
  let body = {};
  try {
    body = JSON.parse(raw);
  } catch {
    body = {};
  }

  if (!response.ok || body.ok === false) {
    const error = new Error(body.error || "Failed to send email via Gmail webhook");
    error.code = "WEBHOOK_ERROR";
    throw error;
  }
}

async function sendViaResend({ to, subject, text }, fetchImpl) {
  const from = envValue("MAIL_FROM") || "Skyplate <onboarding@resend.dev>";
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${envValue("RESEND_API_KEY")}`,
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
  const smtpPort = Number(envValue("SMTP_PORT")) || 465;
  const smtpMail = envValue("SMTP_MAIL");
  const transporter = createTransport({
    host: envValue("SMTP_HOST") || "smtp.gmail.com",
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpMail,
      pass: envValue("SMTP_PASSWORD").replace(/\s/g, ""),
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  await transporter.sendMail({
    from: `"Skyplate" <${smtpMail}>`,
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

  if (transport === "webhook") {
    await sendViaWebhook({ to, subject, text }, fetchImpl);
    return { transport };
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
