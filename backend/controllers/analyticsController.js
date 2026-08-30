import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Order } from "../models/orderSchema.js";
import { buildPeakHoursReport } from "../utils/peakHours.js";

export const getPeakHours = catchAsyncErrors(async (req, res) => {
  const baseUrl = process.env.ML_SERVICE_URL || "http://localhost:5001";

  try {
    const response = await fetch(`${baseUrl}/predict`);
    const payload = await response.json();
    if (response.ok) {
      return res.status(200).json({
        success: true,
        data: { ...payload, source: payload.usedSynthetic ? "flask-synthetic" : "flask" },
      });
    }
  } catch {
    // Flask is optional at runtime; Node fallback keeps the admin chart working.
  }

  const orders = await Order.find({}, { createdAt: 1, date: 1, time: 1 }).lean();
  const report = buildPeakHoursReport(orders);

  res.status(200).json({
    success: true,
    data: report,
  });
});
