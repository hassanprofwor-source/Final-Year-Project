import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    cartItems: [
      {
        name: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },  // Store final price
        size: { type: String, required: true },  // Store selected size
        quantity: { type: Number, required: true } // Store quantity
      }
    ],
    orderType: { type: String, required: true, enum: ["Dine In", "Delivery"] },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Completed"],
      default: "Pending"
    },
    total: { type: Number, required: true },  // Store total as a number
    address: { type: String },
    payment: { type: String },
    date: {
      type: String,
    },
    time:{
      type:String
    },
    people:{
      type:Number
    },
    bookingid:{
      type: String,
    },
    tableNumber:{
      type: Number,
    },
    
  },
  { timestamps: true } // ✅ Adds createdAt and updatedAt fields
);

export const Order = mongoose.model("Order", orderSchema);
