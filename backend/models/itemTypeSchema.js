import mongoose from "mongoose";

const itemTypeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
    },
    { timestamps: true }
);

export const ItemType = mongoose.model("itemtypes", itemTypeSchema);
