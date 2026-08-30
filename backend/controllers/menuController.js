import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { FoodItem } from "../models/menuSchema.js";
import { v2 as cloudinary } from "cloudinary";

export const saveItem = catchAsyncErrors(async (req, res, next) => {
  // Check if a file was uploaded
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Food Image Required.", 400));
  }

  const { foodimage } = req.files;
  const prices = JSON.parse(req.body.prices);

  // Validate the uploaded file's format
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(foodimage.mimetype)) {
    return next(new ErrorHandler("File format not supported.", 400));
  }

  // Destructure required fields from the request body
  const {
    name,
    description,
    type,
    special_ingredient,
  } = req.body;

  const ingredients = req.body.ingredients ? JSON.parse(req.body.ingredients) : [];
  const weatherConditions = req.body.weatherConditions ? JSON.parse(req.body.weatherConditions) : [];

  // Validate required fields
  if (
    !name ||
    !description ||
    !type ||
    !ingredients.length ||
    !special_ingredient ||
    !prices
  ) {
    return next(new ErrorHandler("Please fill all required fields.", 400));
  }

  // Upload the image to Cloudinary
  const cloudinaryResponse = await cloudinary.uploader.upload(
    foodimage.tempFilePath,
    {
      folder: "SKYPLATE",
    }
  );

  // Check for Cloudinary upload errors
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary error:",
      cloudinaryResponse.error || "Unknown cloudinary error."
    );
    return next(
      new ErrorHandler("Failed to upload food image to Cloudinary.", 500)
    );
  }

  // Create the food item in the database
  const foodItem = await FoodItem.create({
    name,
    description,
    type,
    ingredients,
    special_ingredient,
    prices,
    image: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
    weatherConditions,
  });

  // Send success response
  res.status(201).json({
    success: true,
    message: "Food item added successfully.",
    data: foodItem,
  });
});

export const getItems = catchAsyncErrors(async (req, res, next) => {
  const { weather } = req.query;
  const filter = weather ? { weatherConditions: { $in: [weather] } } : {};

  // Retrieve all food items from the database
  const foodItems = await FoodItem.find(filter).populate("type");

  res.status(200).json({
    success: true,
    data: foodItems || [],
  });
});


export const updateItem = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params; // Get the menu item ID from the request
  const {
    name,
    description,
    type,
    special_ingredient,
    prices,
  } = req.body;

  const ingredients = req.body.ingredients ? JSON.parse(req.body.ingredients) : undefined;
  const weatherConditions = req.body.weatherConditions ? JSON.parse(req.body.weatherConditions) : undefined;

  if (
    !name ||
    !description ||
    !type ||
    (ingredients && !ingredients.length) ||
    !special_ingredient ||
    !prices
  ) {
    return next(new ErrorHandler("Please fill all required fields.", 400));
  }
  // Find the item in the database
  let foodItem = await FoodItem.findById(id);
  if (!foodItem) {
    return next(new ErrorHandler("Food item not found.", 404));
  }

  // Handle Image Upload if a new image is provided
  if (req.files && req.files.foodimage) {

    const { foodimage } = req.files;

    // Validate image format
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedFormats.includes(foodimage.mimetype)) {
      return next(new ErrorHandler("File format not supported.", 400));
    }

    // Delete the previous image from Cloudinary
    await cloudinary.uploader.destroy(foodItem.image.public_id);

    // Upload new image to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(
      foodimage.tempFilePath,
      { folder: "SKYPLATE" }
    );

    if (!cloudinaryResponse || cloudinaryResponse.error) {
      return next(
        new ErrorHandler("Failed to upload food image to Cloudinary.", 500)
      );
    }

    console.log("New image uploaded successfully:", cloudinaryResponse);

    // Update image details
    foodItem.image = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    };
  }

  // Update other fields
  foodItem.name = name || foodItem.name;
  foodItem.description = description || foodItem.description;
  foodItem.type = type || foodItem.type;
  foodItem.ingredients = ingredients || foodItem.ingredients;
  foodItem.special_ingredient =
    special_ingredient || foodItem.special_ingredient;
  foodItem.prices = prices ? JSON.parse(prices) : foodItem.prices;
  foodItem.weatherConditions = weatherConditions || foodItem.weatherConditions;


  // Save updated food item
  await foodItem.save();

  res.status(200).json({
    success: true,
    message: "Food item updated successfully.",
    data: foodItem,
  });
});

export const deleteItem = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Find the food item by ID
  const foodItem = await FoodItem.findById(id);
  if (!foodItem) {
    return next(new ErrorHandler("Food item not found.", 404));
  }

  // Delete image from Cloudinary
  if (foodItem.image && foodItem.image.public_id) {
    await cloudinary.uploader.destroy(foodItem.image.public_id);
  }

  // Delete item from database
  await FoodItem.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Food item deleted successfully.",
  });
});
