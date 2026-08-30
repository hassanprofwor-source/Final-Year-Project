import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true }, // Corrected to String
  phone: { type: String }, // Changed from Number to String
  email: { type: String, required: true, unique: true }, // Corrected to String & made unique
  gender: { type: String },
  address: { type: String },
  expoPushToken: { type: String },
  image: {
    public_id: { 
      type: String, 
       },
    url: { 
      type: String, 
       },
  },
});

export const User = mongoose.model("users", UserSchema);
