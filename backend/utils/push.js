import { User } from "../models/userScheme.js";

export const sendPushToEmail = async (email, { title, body, screen }) => {
  if (!email) return;
  try {
    const user = await User.findOne({ email });
    if (!user?.expoPushToken) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: user.expoPushToken,
        sound: "default",
        title,
        body,
        data: { screen },
      }),
    });
  } catch (error) {
    console.error("Push notification failed:", error.message);
  }
};
