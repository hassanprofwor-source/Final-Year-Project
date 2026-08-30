import { config } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { FoodItem } from "../models/menuSchema.js";
import { Order } from "../models/orderSchema.js";
import { FOOD_IMAGES } from "./seedImages.js";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const uploadImage = async (name, sourceUrl) => {
  try {
    const result = await cloudinary.uploader.upload(sourceUrl, {
      folder: "SKYPLATE/seed",
      public_id: slug(name),
      overwrite: true,
      resource_type: "image",
    });
    return { public_id: result.public_id, url: result.secure_url };
  } catch (error) {
    console.log(`cloudinary fallback for ${name}: ${error.message}`);
    return { public_id: `seed/${slug(name)}`, url: sourceUrl };
  }
};

const main = async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error("Cloudinary is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI, { dbName: "Skyplate" });

  const foodByName = {};
  for (const [name, source] of Object.entries(FOOD_IMAGES)) {
    const image = await uploadImage(name, source);
    foodByName[name] = image;
    const updated = await FoodItem.updateMany({ name }, { $set: { image } });
    console.log(`menu: ${name} (${updated.modifiedCount})`);
  }

  const orders = await Order.find({}, { cartItems: 1 }).lean();
  const ops = [];
  for (const order of orders) {
    let changed = false;
    const cartItems = (order.cartItems || []).map((item) => {
      const image = foodByName[item.name];
      if (!image || item.image === image.url) return item;
      changed = true;
      return { ...item, image: image.url };
    });
    if (changed) {
      ops.push({
        updateOne: {
          filter: { _id: order._id },
          update: { $set: { cartItems } },
        },
      });
    }
  }

  if (ops.length) {
    const chunk = 400;
    for (let i = 0; i < ops.length; i += chunk) {
      await Order.bulkWrite(ops.slice(i, i + chunk));
    }
  }

  console.log(`updated order images: ${ops.length}`);
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
