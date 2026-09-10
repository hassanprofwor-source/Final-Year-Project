import { config } from "dotenv";
import mongoose from "mongoose";
import { Order } from "../models/orderSchema.js";

config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "Skyplate" });

  const total = await Order.countDocuments();
  const oldest = await Order.findOne({}).sort({ createdAt: 1 }).select("createdAt");
  const newest = await Order.findOne({}).sort({ createdAt: -1 }).select("createdAt");

  console.log("total orders:", total);
  console.log("oldest UTC:", oldest?.createdAt?.toISOString());
  console.log("newest UTC:", newest?.createdAt?.toISOString());
  console.log("now UTC    :", new Date().toISOString());

  const byHourUtc = await Order.aggregate([
    { $group: { _id: { $hour: { date: "$createdAt", timezone: "UTC" } }, n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const byHourLdn = await Order.aggregate([
    { $group: { _id: { $hour: { date: "$createdAt", timezone: "Europe/London" } }, n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const byHourKhi = await Order.aggregate([
    { $group: { _id: { $hour: { date: "$createdAt", timezone: "Asia/Karachi" } }, n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const fmt = (rows) => rows.map((r) => `${String(r._id).padStart(2, "0")}:${r.n}`).join("  ");
  console.log("\nhour histogram (UTC)          :", fmt(byHourUtc));
  console.log("hour histogram (Europe/London):", fmt(byHourLdn));
  console.log("hour histogram (Asia/Karachi) :", fmt(byHourKhi));

  const items = await Order.aggregate([
    { $unwind: "$cartItems" },
    { $group: { _id: "$cartItems.name", units: { $sum: "$cartItems.quantity" } } },
    { $sort: { units: -1 } },
  ]);
  console.log("\ndistinct items:", items.length);
  console.log("top 5 :", items.slice(0, 5).map((i) => `${i._id}=${i.units}`).join(", "));
  console.log("bot 5 :", items.slice(-5).map((i) => `${i._id}=${i.units}`).join(", "));
  const unitsList = items.map((i) => i.units);
  const sum = unitsList.reduce((a, b) => a + b, 0);
  console.log(`units total=${sum} max=${Math.max(...unitsList)} min=${Math.min(...unitsList)} ratio=${(Math.max(...unitsList) / Math.min(...unitsList)).toFixed(2)}`);

  const prices = await Order.aggregate([
    { $unwind: "$cartItems" },
    { $group: { _id: null, min: { $min: "$cartItems.price" }, max: { $max: "$cartItems.price" }, avg: { $avg: "$cartItems.price" } } },
  ]);
  console.log("\nline price min/avg/max:", prices[0]?.min, Math.round(prices[0]?.avg), prices[0]?.max);

  const orderDays = await Order.aggregate([
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Europe/London" } }, n: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $limit: 12 },
  ]);
  console.log("\nlast 12 days (London):", orderDays.map((d) => `${d._id}=${d.n}`).join("  "));

  await mongoose.disconnect();
};

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
