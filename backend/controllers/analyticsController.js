import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { FoodItem } from "../models/menuSchema.js";
import { Order } from "../models/orderSchema.js";
import { buildMenuInsights } from "../utils/menuInsights.js";
import { buildPeakHoursReport } from "../utils/peakHours.js";

const mlServiceUrl = () => process.env.ML_SERVICE_URL || "http://localhost:5001";

export const getPeakHours = catchAsyncErrors(async (req, res) => {
  const baseUrl = mlServiceUrl();

  try {
    const response = await fetch(`${baseUrl}/predict`);
    const payload = await response.json();
    if (response.ok) {
      return res.status(200).json({
        success: true,
        data: payload,
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

export const getMenuInsights = catchAsyncErrors(async (req, res) => {
  const baseUrl = mlServiceUrl();

  try {
    const response = await fetch(`${baseUrl}/insights/menu`);
    const payload = await response.json();
    if (response.ok) {
      return res.status(200).json({
        success: true,
        data: payload,
      });
    }
  } catch {
    // Flask is optional; ranking still works from live orders.
  }

  const [orders, menuItems] = await Promise.all([
    Order.find(
      { status: { $in: ["Accepted", "Completed"] } },
      { createdAt: 1, date: 1, time: 1, status: 1, cartItems: 1 }
    ).lean(),
    FoodItem.find({}, { name: 1, image: 1 }).lean(),
  ]);

  res.status(200).json({
    success: true,
    data: buildMenuInsights(orders, menuItems),
  });
});

export const getItemDemand = catchAsyncErrors(async (req, res, next) => {
  const baseUrl = mlServiceUrl();

  try {
    const response = await fetch(`${baseUrl}/insights/demand`);
    const payload = await response.json();
    if (response.ok) {
      return res.status(200).json({
        success: true,
        data: payload,
      });
    }
  } catch {
    // Forecasting has no Node equivalent; the model lives in the ML service.
  }

  return next(
    new ErrorHandler("ML service is not available for demand forecasting.", 503)
  );
});

export const getModelMetrics = catchAsyncErrors(async (req, res, next) => {
  const baseUrl = mlServiceUrl();

  try {
    const response = await fetch(`${baseUrl}/metrics`);
    const payload = await response.json();
    if (response.ok) {
      return res.status(200).json({
        success: true,
        data: payload,
      });
    }
  } catch {
    // Training metrics only exist where the model is trained.
  }

  return next(new ErrorHandler("ML service is not available.", 503));
});

export const retrainPeakHours = catchAsyncErrors(async (req, res, next) => {
  const baseUrl = mlServiceUrl();

  try {
    const response = await fetch(`${baseUrl}/train`, { method: "POST" });
    const payload = await response.json();
    if (response.ok) {
      return res.status(200).json({
        success: true,
        data: payload,
      });
    }
  } catch {
    // Retrain requires the Flask service.
  }

  return next(new ErrorHandler("ML service is not available to retrain.", 503));
});
