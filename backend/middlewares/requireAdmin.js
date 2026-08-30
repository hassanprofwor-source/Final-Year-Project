import { getAuth } from "@clerk/express";
import ErrorHandler from "./error.js";

export const requireAdmin = (req, res, next) => {
  const { userId, sessionClaims } = getAuth(req);

  if (!userId) {
    return next(new ErrorHandler("Authentication required.", 401));
  }

  if (sessionClaims?.metadata?.role !== "admin") {
    return next(new ErrorHandler("Admin access required.", 403));
  }

  next();
};
