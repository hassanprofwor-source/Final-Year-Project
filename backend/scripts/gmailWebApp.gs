/**
 * Google Apps Script web app that sends Skyplate review replies through Gmail.
 *
 * 1. Open https://script.google.com → New project
 * 2. Paste this file, then set WEBHOOK_SECRET to the same value as MAIL_WEBHOOK_SECRET on Render
 * 3. Deploy → New deployment → Type: Web app
 *    Execute as: Me
 *    Who has access: Anyone
 * 4. Authorize Gmail when asked
 * 5. Copy the Web app URL into MAIL_WEBHOOK_URL on skyplate-api
 */
const WEBHOOK_SECRET = "replace-with-MAIL_WEBHOOK_SECRET";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.secret || data.secret !== WEBHOOK_SECRET) {
      return json_({ ok: false, error: "Unauthorized" });
    }
    if (!data.to || !data.subject || !data.text) {
      return json_({ ok: false, error: "Missing to, subject, or text" });
    }
    GmailApp.sendEmail(data.to, data.subject, data.text, { name: "Skyplate" });
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
