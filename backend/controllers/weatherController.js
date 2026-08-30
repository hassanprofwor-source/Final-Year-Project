import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { FoodItem } from "../models/menuSchema.js";

const COLD_CONDITIONS = ["Rain", "Drizzle", "Snow", "Mist", "Fog", "Clouds", "Thunderstorm"];
const WARM_CONDITIONS = ["Clear"];

const weatherIcon = (condition, isDaytime) => {
  const key = (condition || "").toLowerCase();
  const period = isDaytime ? "d" : "n";
  if (key === "clear") return `https://openweathermap.org/img/wn/01${period}@2x.png`;
  if (key === "rain" || key === "drizzle") return `https://openweathermap.org/img/wn/10${period}@2x.png`;
  if (key === "clouds") return `https://openweathermap.org/img/wn/02${period}@2x.png`;
  if (key === "thunderstorm") return `https://openweathermap.org/img/wn/11${period}@2x.png`;
  if (key === "snow") return `https://openweathermap.org/img/wn/13${period}@2x.png`;
  return `https://openweathermap.org/img/wn/50${period}@2x.png`;
};

export const getWeatherSuggestions = catchAsyncErrors(async (req, res, next) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const cityId = process.env.OPENWEATHER_CITY_ID || "1177654";

  if (!apiKey) {
    return next(new ErrorHandler("OpenWeatherMap API key is not configured.", 500));
  }

  const weatherRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?id=${cityId}&units=metric&appid=${apiKey}`
  );
  const weatherData = await weatherRes.json();

  if (!weatherRes.ok || weatherData.cod !== 200) {
    return next(new ErrorHandler(weatherData.message || "Failed to fetch weather.", 502));
  }

  const condition = weatherData.weather?.[0]?.main || "Clear";
  const temp = weatherData.main?.temp;
  const now = Date.now() / 1000;
  const isDaytime = now >= weatherData.sys.sunrise && now <= weatherData.sys.sunset;

  const matchConditions = new Set([condition]);
  if (typeof temp === "number" && temp < 18) {
    COLD_CONDITIONS.forEach((c) => matchConditions.add(c));
  }
  if (typeof temp === "number" && temp > 28) {
    WARM_CONDITIONS.forEach((c) => matchConditions.add(c));
  }

  const suggestions = await FoodItem.find({
    weatherConditions: { $in: Array.from(matchConditions) },
  }).populate("type");

  res.status(200).json({
    success: true,
    data: {
      city: weatherData.name,
      temp,
      condition,
      description: weatherData.weather?.[0]?.description,
      isDaytime,
      icon: weatherIcon(condition, isDaytime),
      suggestions,
    },
  });
});
