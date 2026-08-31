import { clerkClient, getAuth } from "@clerk/express";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userScheme.js";
import { v2 as cloudinary } from "cloudinary";

const findClerkUserByEmail = async (email) => {
  if (!email) return null;
  try {
    const result = await clerkClient.users.getUserList({
      emailAddress: [String(email).toLowerCase()],
      limit: 1,
    });
    const list = Array.isArray(result) ? result : result.data ?? [];
    return list[0] || null;
  } catch (err) {
    console.error("Clerk user lookup failed:", err);
    return null;
  }
};

const syncClerkName = async (email, firstName, lastName) => {
  const clerkUser = await findClerkUserByEmail(email);
  if (!clerkUser) return { synced: false };
  await clerkClient.users.updateUser(clerkUser.id, { firstName, lastName });
  return { synced: true };
};

export const saveUser = catchAsyncErrors(async (req, res, next) => {
  const { firstname, lastname, email } = req.body;

  // Validate input fields
  if (!firstname || !lastname || !email) {
    return next(new ErrorHandler("All fields are required.", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(200).json({
      success: true,
      message: "User already registered.",
      user: existingUser,
    });
  }

  // Create and save user
  const user = await User.create({ 
    firstname, 
    lastname, 
    email 
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully.",
    user,
  });
});



export const updateUser = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.params;
  const { firstname, lastname, gender, birthdate, phone, address } = req.body;

  // Find the user in the database
  let user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  // Handle Image Upload if a new image is provided
  if (req.files && req.files.userimage) {
    const { userimage } = req.files;

    console.log(user.image.url)
    console.log(userimage)
    // Check if the image is the same as the existing one
    if (user.image?.url !== userimage) { // Compare with the database value
      console.log("New image detected. Uploading...");

      // Validate image format
      const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
      if (!allowedFormats.includes(userimage.mimetype)) {
        return next(new ErrorHandler("File format not supported.", 400));
      }

      // Delete the previous image from Cloudinary (if it exists)
      if (user.image?.public_id) {
        await cloudinary.uploader.destroy(user.image.public_id);
        console.log("Previous image deleted from Cloudinary.");
      }

      // Upload new image to Cloudinary
      const cloudinaryResponse = await cloudinary.uploader.upload(
        userimage.tempFilePath,
        { folder: "SKYPLATE" }
      );

      if (!cloudinaryResponse || cloudinaryResponse.error) {
        return next(new ErrorHandler("Failed to upload image to Cloudinary.", 500));
      }

      console.log("New image uploaded successfully:", cloudinaryResponse);

      // Update image details in database
      user.image = {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      };
    } else {
      console.log("Same image detected. Skipping upload.");
    }
  }

  // Update other fields
  user.firstname = firstname || user.firstname;
  user.lastname = lastname || user.lastname;
  user.gender = gender || user.gender;
  user.birthdate = birthdate || user.birthdate;
  user.phone = phone || user.phone;
  user.address = address || user.address;

  // Save updated user data
  await user.save();

  res.status(200).json({
    success: true,
    message: "User updated successfully.",
    data: user,
  });
});




export const getUsers = catchAsyncErrors(async (req, res) => {
  const users = await User.find().sort({ firstname: 1, lastname: 1 });

  res.status(200).json({
    success: true,
    data: users,
  });
});

export const adminUpdateUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { firstname, lastname, phone, gender, address } = req.body;

  if (!firstname?.trim() || !lastname?.trim()) {
    return next(new ErrorHandler("First name and last name are required.", 400));
  }

  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  user.firstname = firstname.trim();
  user.lastname = lastname.trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (gender !== undefined) user.gender = gender;
  if (address !== undefined) user.address = String(address).trim();
  await user.save();

  try {
    await syncClerkName(user.email, user.firstname, user.lastname);
  } catch (err) {
    console.error("Clerk user update failed:", err);
    return res.status(200).json({
      success: true,
      message: "Profile saved, but the Clerk account name could not be synced.",
      data: user,
    });
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully.",
    data: user,
  });
});

export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { userId: adminClerkId } = getAuth(req);

  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  const clerkUser = await findClerkUserByEmail(user.email);
  if (clerkUser) {
    if (clerkUser.id === adminClerkId) {
      return next(new ErrorHandler("You cannot delete your own account.", 403));
    }
    if (clerkUser.publicMetadata?.role === "admin") {
      return next(new ErrorHandler("Admin accounts cannot be deleted from here.", 403));
    }
    try {
      await clerkClient.users.deleteUser(clerkUser.id);
    } catch (err) {
      console.error("Clerk user delete failed:", err);
      return next(new ErrorHandler("Failed to delete this user from Clerk.", 502));
    }
  }

  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully.",
  });
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.params; // Get the menu item ID from the request
  const user = await User.find({ email });

  // Check if any items exist
  if (!user || user.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No User found.",
    });
  }

  // Send the food items in the response
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const savePushToken = catchAsyncErrors(async (req, res, next) => {
  const { email, token } = req.body;
  if (!email || !token) {
    return next(new ErrorHandler("Email and token are required.", 400));
  }

  const user = await User.findOneAndUpdate(
    { email },
    { expoPushToken: token },
    { new: true }
  );
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Push token saved.",
  });
});