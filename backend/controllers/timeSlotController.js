import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { TimeSlot } from "../models/timeSlotSchema.js";

const pad = (value) => (value < 10 ? `0${value}` : `${value}`);

export const DEFAULT_TIME_SLOTS = Array.from({ length: 11 }, (_, i) => `${pad(i + 12)}:00`);

export const normalizeTime = (value) => {
  if (value === undefined || value === null) return null;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return `${pad(hour)}:${pad(minute)}`;
};

export const minutesFromTime = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

export const ensureDefaultTimeSlots = async () => {
  const count = await TimeSlot.countDocuments();
  if (count > 0) return;
  try {
    await TimeSlot.insertMany(
      DEFAULT_TIME_SLOTS.map((time) => ({
        time,
        enabled: true,
        sortOrder: minutesFromTime(time),
      }))
    );
  } catch {
    // Unique index can race on first boot; a retrying GET will see the seeded rows.
  }
};

export const getTimeSlots = catchAsyncErrors(async (req, res) => {
  await ensureDefaultTimeSlots();
  const slots = await TimeSlot.find({ enabled: true }).sort({ sortOrder: 1, time: 1 });
  res.status(200).json({
    success: true,
    data: slots,
  });
});

export const getAllTimeSlots = catchAsyncErrors(async (req, res) => {
  await ensureDefaultTimeSlots();
  const slots = await TimeSlot.find().sort({ sortOrder: 1, time: 1 });
  res.status(200).json({
    success: true,
    data: slots,
  });
});

export const saveTimeSlot = catchAsyncErrors(async (req, res, next) => {
  const time = normalizeTime(req.body.time);
  if (!time) {
    return next(new ErrorHandler("Please provide a valid time such as 12:00.", 400));
  }

  const existing = await TimeSlot.findOne({ time });
  if (existing) {
    return next(new ErrorHandler("That time slot already exists.", 400));
  }

  const enabled = req.body.enabled === false || req.body.enabled === "false" ? false : true;
  const slot = await TimeSlot.create({
    time,
    enabled,
    sortOrder: minutesFromTime(time),
  });

  res.status(201).json({
    success: true,
    message: "Time slot created successfully.",
    data: slot,
  });
});

export const updateTimeSlot = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const slot = await TimeSlot.findById(id);
  if (!slot) {
    return next(new ErrorHandler("Time slot not found.", 404));
  }

  if (req.body.time !== undefined) {
    const time = normalizeTime(req.body.time);
    if (!time) {
      return next(new ErrorHandler("Please provide a valid time such as 12:00.", 400));
    }
    const duplicate = await TimeSlot.findOne({ _id: { $ne: id }, time });
    if (duplicate) {
      return next(new ErrorHandler("That time slot already exists.", 400));
    }
    slot.time = time;
    slot.sortOrder = minutesFromTime(time);
  }

  if (req.body.enabled !== undefined) {
    slot.enabled = req.body.enabled === false || req.body.enabled === "false" ? false : true;
  }

  await slot.save();

  res.status(200).json({
    success: true,
    message: "Time slot updated successfully.",
    data: slot,
  });
});

export const deleteTimeSlot = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const slot = await TimeSlot.findById(id);
  if (!slot) {
    return next(new ErrorHandler("Time slot not found.", 404));
  }

  await TimeSlot.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Time slot deleted successfully.",
  });
});
