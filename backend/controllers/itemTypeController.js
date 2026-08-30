import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { ItemType } from "../models/itemTypeSchema.js";
import { FoodItem } from "../models/menuSchema.js";

export const saveItemType = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;

  if (!name) {
    return next(new ErrorHandler("Please provide a type name.", 400));
  }

  const existingType = await ItemType.findOne({ name });
  if (existingType) {
    return res.status(400).json({
      success: false,
      message: "Item type already exists.",
    });
  }

  const itemType = await ItemType.create({ name });

  res.status(201).json({
    success: true,
    message: "Item type created successfully.",
    data: itemType,
  });
});

export const getItemTypes = catchAsyncErrors(async (req, res, next) => {
  const itemTypes = await ItemType.find();

  res.status(200).json({
    success: true,
    data: itemTypes,
  });
});

export const updateItemType = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  const existingType = await ItemType.findOne({
    _id: { $ne: id },
    name,
  });
  if (existingType) {
    return res.status(400).json({
      success: false,
      message: "Item type with same name already exists.",
    });
  }

  const itemType = await ItemType.findById(id);
  if (!itemType) {
    return next(new ErrorHandler("Item type not found.", 404));
  }

  itemType.name = name || itemType.name;
  await itemType.save();

  res.status(200).json({
    success: true,
    message: "Item type updated successfully.",
    data: itemType,
  });
});

export const deleteItemType = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const itemType = await ItemType.findById(id);
  if (!itemType) {
    return next(new ErrorHandler("Item type not found.", 404));
  }

  const inUse = await FoodItem.exists({ type: id });
  if (inUse) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete: this type is used by existing menu items.",
    });
  }

  await ItemType.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Item type deleted successfully.",
  });
});
