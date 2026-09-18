import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  describeMailError,
  getMailTransport,
  sendMail,
  statusForMailError,
} from "../utils/mail.js";

const tracked = ["RESEND_API_KEY", "SMTP_MAIL", "SMTP_PASSWORD", "SMTP_HOST", "SMTP_PORT", "RENDER", "MAIL_FROM"];
const original = Object.fromEntries(tracked.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of tracked) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
}

afterEach(restoreEnv);

describe("getMailTransport", () => {
  it("prefers Resend when an API key is set", () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.SMTP_MAIL = "skyplate@gmail.com";
    process.env.SMTP_PASSWORD = "app-password";
    assert.equal(getMailTransport(), "resend");
  });

  it("uses SMTP when only Gmail credentials are set", () => {
    delete process.env.RESEND_API_KEY;
    process.env.SMTP_MAIL = "skyplate@gmail.com";
    process.env.SMTP_PASSWORD = "app-password";
    assert.equal(getMailTransport(), "smtp");
  });

  it("returns null when nothing is configured", () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_MAIL;
    delete process.env.SMTP_PASSWORD;
    assert.equal(getMailTransport(), null);
  });

  it("treats quoted or whitespace-only keys as unset", () => {
    process.env.RESEND_API_KEY = '  "re_test"  ';
    assert.equal(getMailTransport(), "resend");
    process.env.RESEND_API_KEY = "   ";
    process.env.SMTP_MAIL = "";
    process.env.SMTP_PASSWORD = "";
    assert.equal(getMailTransport(), null);
  });
});

describe("sendMail", () => {
  it("sends through Resend over HTTPS", async () => {
    process.env.RESEND_API_KEY = "re_test";
    delete process.env.RENDER;

    let calledWith;
    const fetchImpl = async (url, options) => {
      calledWith = { url, options };
      return { ok: true, json: async () => ({ id: "email_1" }) };
    };

    const result = await sendMail(
      { to: "guest@example.com", subject: "Reply", text: "Thanks" },
      { fetchImpl },
    );

    assert.equal(result.transport, "resend");
    assert.equal(calledWith.url, "https://api.resend.com/emails");
    assert.equal(calledWith.options.method, "POST");
    assert.equal(calledWith.options.headers.Authorization, "Bearer re_test");
    assert.deepEqual(JSON.parse(calledWith.options.body), {
      from: "Skyplate <onboarding@resend.dev>",
      to: ["guest@example.com"],
      subject: "Reply",
      text: "Thanks",
    });
  });

  it("refuses SMTP on Render instead of hanging on a blocked port", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.SMTP_MAIL = "skyplate@gmail.com";
    process.env.SMTP_PASSWORD = "app-password";
    process.env.RENDER = "true";

    await assert.rejects(
      () => sendMail({ to: "guest@example.com", subject: "Reply", text: "Thanks" }),
      (error) => error.code === "SMTP_BLOCKED",
    );
  });

  it("uses SMTP locally when Resend is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RENDER;
    process.env.SMTP_MAIL = "skyplate@gmail.com";
    process.env.SMTP_PASSWORD = "abcd efgh ijkl mnop";

    let payload;
    const createTransport = () => ({
      sendMail: async (mail) => {
        payload = mail;
      },
    });

    const result = await sendMail(
      { to: "guest@example.com", subject: "Reply", text: "Thanks" },
      { createTransport },
    );

    assert.equal(result.transport, "smtp");
    assert.equal(payload.to, "guest@example.com");
    assert.equal(payload.from, '"Skyplate" <skyplate@gmail.com>');
  });
});

describe("describeMailError", () => {
  it("maps missing config and auth failures", () => {
    assert.match(describeMailError({ code: "MAIL_NOT_CONFIGURED" }), /RESEND_API_KEY/);
    assert.match(describeMailError({ code: "EAUTH" }), /App Password/);
    assert.equal(statusForMailError({ code: "MAIL_NOT_CONFIGURED" }), 503);
    assert.equal(statusForMailError({ code: "EAUTH" }), 500);
  });

  it("does not hide Resend API errors behind the SMTP message", () => {
    process.env.RENDER = "true";
    assert.equal(
      describeMailError({ code: "RESEND_ERROR", message: "You can only send testing emails to your own email address." }),
      "You can only send testing emails to your own email address.",
    );
  });
});
