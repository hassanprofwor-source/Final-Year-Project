import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
    {
        number: { type: Number, required: true, unique: true },
        capacity: { type: Number, required: true },
    },
    { timestamps: true }
);

export const Table = mongoose.model("tables", tableSchema);
