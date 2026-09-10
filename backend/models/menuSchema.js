import mongoose from "mongoose";

const WEATHER_CONDITIONS = [
  "Thunderstorm",
  "Drizzle",
  "Rain",
  "Snow",
  "Mist",
  "Smoke",
  "Haze",
  "Dust",
  "Fog",
  "Sand",
  "Ash",
  "Squall",
  "Tornado",
  "Clear",
  "Clouds",
];

const FoodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: mongoose.Schema.Types.ObjectId, ref: "itemtypes", required: true },
    ingredients: { type: [String], required: true },
    special_ingredient: { type: String, required: true },
    weatherConditions: { type: [String], enum: WEATHER_CONDITIONS, default: [] },
    image: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    prices: [
      {
        size: { type: String, },
        price: { type: Number, },
        currency: { type: String, default: '£' },
      },
    ],
  },
  { timestamps: true }
);


export const FoodItem = mongoose.model('fooditems', FoodItemSchema);
