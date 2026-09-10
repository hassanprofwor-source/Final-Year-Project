import { config } from "dotenv";
import mongoose from "mongoose";
import { ItemType } from "../models/itemTypeSchema.js";
import { FoodItem } from "../models/menuSchema.js";
import { Table } from "../models/tableSchema.js";
import { Booking } from "../models/bookingSchema.js";
import { Feedback } from "../models/feedbackSchema.js";
import { Order } from "../models/orderSchema.js";
import { TimeSlot } from "../models/timeSlotSchema.js";
import { foodPhoto } from "./seedImages.js";
import { CURRENCY_SYMBOL } from "../utils/currency.js";

config();

const DAYS = 240;
const SEED = 20260910;

// Analytics buckets orders by their Europe/London wall clock, so the seeder has
// to place them on that same clock. Building timestamps from the machine's local
// zone instead shifts every order by the UTC offset and moves the whole service
// window into hours the kitchen never trades in.
const TZ = process.env.ANALYTICS_TZ || "Europe/London";

const ZONE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  hourCycle: "h23", // without this some ICU builds render midnight as hour 24
});

const zoneParts = (date) => {
  const parts = {};
  for (const part of ZONE_FORMAT.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return parts;
};

const zoneOffsetAt = (instantMs) => {
  const p = zoneParts(new Date(instantMs));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - instantMs;
};

/** Build the UTC instant whose wall-clock reading in TZ is the supplied date. */
const zonedTime = (year, month, day, hour, minute = 0, second = 0) => {
  const naive = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = naive - zoneOffsetAt(naive);
  // A second pass settles the two days a year when the offset changes.
  instant = naive - zoneOffsetAt(instant);
  return new Date(instant);
};

const pad = (value) => String(value).padStart(2, "0");
const formatDate = (date) => {
  const p = zoneParts(date);
  return `${pad(p.day)}-${pad(p.month)}-${p.year}`;
};
const formatTime = (date) => `${pad(zoneParts(date).hour)}:00`;

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const gaussian = (rng) => {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const CUSTOMERS = [
  { firstname: "Ahmed", lastname: "Khan", email: "ahmed.khan.lhr@gmail.com", phone: "07700 900412", address: "14 Wilmslow Road, Rusholme, Manchester M14 5TQ" },
  { firstname: "Fatima", lastname: "Malik", email: "fatima.malik88@gmail.com", phone: "07700 900188", address: "22a Curry Mile, Rusholme, Manchester M14 5NA" },
  { firstname: "Hassan", lastname: "Raza", email: "hassan.raza.pk@gmail.com", phone: "07700 900567", address: "Flat 8, Hathersage Road, Manchester M13 0FW" },
  { firstname: "Ayesha", lastname: "Siddiqui", email: "ayesha.siddiqui21@gmail.com", phone: "07700 900778", address: "3 Platt Lane, Fallowfield, Manchester M14 7FB" },
  { firstname: "Usman", lastname: "Ali", email: "usman.ali.orders@gmail.com", phone: "07700 900223", address: "19 Egerton Road, Fallowfield, Manchester M14 6XR" },
  { firstname: "Zainab", lastname: "Iqbal", email: "zainab.iqbal.lhr@gmail.com", phone: "07700 900901", address: "41 Yew Tree Road, Withington, Manchester M20 4PJ" },
  { firstname: "Bilal", lastname: "Ahmed", email: "bilal.ahmed.food@gmail.com", phone: "07700 900445", address: "12 Burton Road, West Didsbury, Manchester M20 1JD" },
  { firstname: "Sara", lastname: "Nawaz", email: "sara.nawaz07@gmail.com", phone: "07700 900780", address: "9 Lapwing Lane, Didsbury, Manchester M20 2NT" },
  { firstname: "Omar", lastname: "Sheikh", email: "omar.sheikh.lhr@gmail.com", phone: "07700 900112", address: "45 Deansgate, Manchester M3 2AY" },
  { firstname: "Hira", lastname: "Shah", email: "hira.shah.eats@gmail.com", phone: "07700 900667", address: "18 Oxford Road, Manchester M1 5QA" },
  { firstname: "Hamza", lastname: "Tariq", email: "hamza.tariq.pk@gmail.com", phone: "07700 900334", address: "11 Whitworth Street, Manchester M1 3WS" },
  { firstname: "Noor", lastname: "Fatima", email: "noor.fatima.dine@gmail.com", phone: "07700 900998", address: "27 Portland Street, Manchester M1 4GP" },
  { firstname: "Ali", lastname: "Haider", email: "ali.haider.lhr@gmail.com", phone: "07700 900556", address: "8b Chorlton Road, Old Trafford, Manchester M16 7WW" },
  { firstname: "Maryam", lastname: "Javed", email: "maryam.javed22@gmail.com", phone: "07700 900871", address: "5 Barlow Moor Road, Chorlton, Manchester M21 8BF" },
  { firstname: "Zeeshan", lastname: "Butt", email: "zeeshan.butt.orders@gmail.com", phone: "07700 900778", address: "33 Beech Road, Chorlton, Manchester M21 9EQ" },
  { firstname: "Sana", lastname: "Qureshi", email: "sana.qureshi.lhr@gmail.com", phone: "07700 900120", address: "16 Palatine Road, Withington, Manchester M20 3JA" },
  { firstname: "Ibrahim", lastname: "Dar", email: "ibrahim.dar.food@gmail.com", phone: "07700 900443", address: "2 Canal Street, Manchester M1 3HE" },
  { firstname: "Amina", lastname: "Rashid", email: "amina.rashid.pk@gmail.com", phone: "07700 900667", address: "70 Stockport Road, Levenshulme, Manchester M19 3AB" },
  { firstname: "Taha", lastname: "Mehmood", email: "taha.mehmood.lhr@gmail.com", phone: "07700 900991", address: "14 Albert Road, Levenshulme, Manchester M19 2EE" },
  { firstname: "Laiba", lastname: "Anwar", email: "laiba.anwar.eats@gmail.com", phone: "07700 900334", address: "11 Kingsway, Burnage, Manchester M19 1PP" },
  { firstname: "Farhan", lastname: "Saeed", email: "farhan.saeed.dine@gmail.com", phone: "07700 900221", address: "6c Moseley Road, Fallowfield, Manchester M14 6NR" },
  { firstname: "Iqra", lastname: "Yousaf", email: "iqra.yousaf.lhr@gmail.com", phone: "07700 900788", address: "23 Anson Road, Victoria Park, Manchester M14 5BZ" },
  { firstname: "Shahzaib", lastname: "Aslam", email: "shahzaib.aslam.pk@gmail.com", phone: "07700 900456", address: "9 Upper Brook Street, Manchester M13 9TQ" },
  { firstname: "Mahnoor", lastname: "Aziz", email: "mahnoor.aziz.food@gmail.com", phone: "07700 900167", address: "4 Dickenson Road, Longsight, Manchester M13 0YR" },
  { firstname: "Rehan", lastname: "Mir", email: "rehan.mir.orders@gmail.com", phone: "07700 900125", address: "17 Great Ancoats Street, Manchester M4 5AD" },
  { firstname: "Hafsa", lastname: "Kamal", email: "hafsa.kamal.lhr@gmail.com", phone: "07700 900674", address: "31 Ayres Road, Old Trafford, Manchester M16 9WA" },
  { firstname: "Danish", lastname: "Nadeem", email: "danish.nadeem.pk@gmail.com", phone: "07700 900901", address: "12a Seymour Grove, Old Trafford, Manchester M16 0LN" },
  { firstname: "Anaya", lastname: "Farooq", email: "anaya.farooq.eats@gmail.com", phone: "07700 900233", address: "8 Wellington Road, Whalley Range, Manchester M16 8LU" },
  { firstname: "Junaid", lastname: "Akram", email: "junaid.akram.dine@gmail.com", phone: "07700 900788", address: "5 Withington Road, Whalley Range, Manchester M16 8EE" },
  { firstname: "Rida", lastname: "Hassan", email: "rida.hassan.lhr@gmail.com", phone: "07700 900441", address: "19 Slade Lane, Levenshulme, Manchester M19 2AE" },
  { firstname: "Saad", lastname: "Chaudhry", email: "saad.chaudhry.food@gmail.com", phone: "07700 900556", address: "27 King Street, Manchester M2 6AW" },
  { firstname: "Emaan", lastname: "Zahid", email: "emaan.zahid.pk@gmail.com", phone: "07700 900347", address: "2 Cross Street, Manchester M2 7AA" },
];

const TYPE_NAMES = [
  "Starters",
  "Soups",
  "Salads",
  "Mains",
  "Grill",
  "Biryani & Rice",
  "Breads",
  "Desserts",
  "Hot Drinks",
  "Cold Drinks",
];

const gbp = (size, price) => ({ size, price, currency: CURRENCY_SYMBOL });

// popularity  relative pull when a basket picks from this course
// trend       fractional change in that pull across the whole seeded window
// season      "cold" sells harder in winter, "warm" in summer, null is flat
const MENU = [
  {
    type: "Starters",
    name: "Chicken Pakora",
    description: "Crisp gram-flour fritters with mint chutney. A rainy-day favourite with karak chai.",
    ingredients: ["chicken", "gram flour", "spices", "mint chutney"],
    special_ingredient: "Ajwain tempering",
    weatherConditions: ["Rain", "Clouds"],
    prices: [gbp("R", 5.5)],
    popularity: 26,
    trend: 0.1,
    season: "cold",
  },
  {
    type: "Starters",
    name: "Seekh Kebab Platter",
    description: "Charcoal-grilled minced kebab with onions, lemon and raita.",
    ingredients: ["beef mince", "papaya", "chillies", "raita"],
    special_ingredient: "Smoked charcoal finish",
    weatherConditions: ["Clouds", "Clear"],
    prices: [gbp("R", 8.9)],
    popularity: 55,
    trend: 0.15,
    season: null,
  },
  {
    type: "Starters",
    name: "Dynamite Prawns",
    description: "Crispy prawns tossed in a sweet-chilli mayo. Light enough for warm evenings.",
    ingredients: ["prawns", "mayo", "chilli sauce", "spring onion"],
    special_ingredient: "House dynamite sauce",
    weatherConditions: ["Clear"],
    prices: [gbp("R", 9.5)],
    popularity: 8,
    trend: 0.35,
    season: "warm",
  },
  {
    type: "Soups",
    name: "Chicken Corn Soup",
    description: "A Lahore classic — silky stock, sweet corn and shredded chicken.",
    ingredients: ["chicken", "sweet corn", "egg drop", "stock"],
    special_ingredient: "White pepper finish",
    weatherConditions: ["Rain", "Clouds", "Thunderstorm"],
    prices: [gbp("S", 4.2), gbp("M", 5.4), gbp("L", 6.5)],
    popularity: 50,
    trend: -0.05,
    season: "cold",
  },
  {
    type: "Soups",
    name: "Hot & Sour Soup",
    description: "Tangy broth with vegetables and chicken. Best when the weather turns.",
    ingredients: ["chicken", "vinegar", "soya", "vegetables"],
    special_ingredient: "Chilli-vinegar oil",
    weatherConditions: ["Rain", "Clouds"],
    prices: [gbp("S", 4.4), gbp("M", 5.6), gbp("L", 6.7)],
    popularity: 15,
    trend: -0.3,
    season: "cold",
  },
  {
    type: "Soups",
    name: "Cream of Mushroom",
    description: "Slow-simmered mushrooms with cream and thyme.",
    ingredients: ["mushroom", "cream", "garlic", "thyme"],
    special_ingredient: "Truffle oil drizzle",
    weatherConditions: ["Rain", "Clouds", "Fog"],
    prices: [gbp("S", 4.6), gbp("M", 5.9), gbp("L", 6.9)],
    popularity: 7,
    trend: -0.5,
    season: "cold",
  },
  {
    type: "Salads",
    name: "Caesar Salad",
    description: "Crisp romaine, parmesan, croutons and house Caesar dressing.",
    ingredients: ["romaine", "parmesan", "croutons", "anchovy dressing"],
    special_ingredient: "Soft-boiled egg",
    weatherConditions: ["Clear"],
    prices: [gbp("R", 7.5)],
    popularity: 10,
    trend: 0.2,
    season: "warm",
  },
  {
    type: "Salads",
    name: "Fattoush",
    description: "Levantine salad with toasted pita, sumac and pomegranate molasses.",
    ingredients: ["lettuce", "tomato", "cucumber", "pita", "sumac"],
    special_ingredient: "Pomegranate molasses",
    weatherConditions: ["Clear"],
    prices: [gbp("R", 6.9)],
    popularity: 6,
    trend: -0.35,
    season: "warm",
  },
  {
    type: "Mains",
    name: "Chicken Karahi",
    description: "Wok-tossed chicken in tomato, ginger and green chilli. Served with naan.",
    ingredients: ["chicken", "tomato", "ginger", "green chilli"],
    special_ingredient: "Kasuri methi",
    weatherConditions: ["Rain", "Clouds"],
    prices: [gbp("R", 16.5)],
    popularity: 100,
    trend: 0.05,
    season: null,
  },
  {
    type: "Mains",
    name: "Beef Nihari",
    description: "Overnight-slow nihari with bone marrow, julienne ginger and garam masala.",
    ingredients: ["beef shank", "nihari masala", "ginger", "naan"],
    special_ingredient: "Bone marrow tadka",
    weatherConditions: ["Rain", "Clouds", "Fog"],
    prices: [gbp("R", 14.9)],
    popularity: 45,
    trend: -0.45,
    season: "cold",
  },
  {
    type: "Mains",
    name: "Butter Chicken",
    description: "Tandoori chicken simmered in a silky tomato-butter gravy.",
    ingredients: ["chicken", "tomato", "butter", "cream"],
    special_ingredient: "Dried fenugreek",
    weatherConditions: ["Clouds", "Clear"],
    prices: [gbp("R", 13.9)],
    popularity: 85,
    trend: 0.7,
    season: null,
  },
  {
    type: "Mains",
    name: "Daal Mash Tadka",
    description: "Creamy white lentils finished with garlic, chilli and ghee.",
    ingredients: ["maash daal", "ghee", "garlic", "chilli"],
    special_ingredient: "Smoked ghee tadka",
    weatherConditions: ["Rain", "Clouds"],
    prices: [gbp("R", 8.2)],
    popularity: 20,
    trend: 0.1,
    season: null,
  },
  {
    type: "Mains",
    name: "Grilled Fish",
    description: "Masala-marinated fish fillet with lemon butter and garden salad.",
    ingredients: ["fish fillet", "lemon", "garlic", "salad"],
    special_ingredient: "Charcoal lemon butter",
    weatherConditions: ["Clear"],
    prices: [gbp("R", 17.9)],
    popularity: 12,
    trend: 0.15,
    season: "warm",
  },
  {
    type: "Mains",
    name: "Chicken Handi",
    description: "Yoghurt-based handi with cream, green chilli and coriander.",
    ingredients: ["chicken", "yoghurt", "cream", "green chilli"],
    special_ingredient: "Handi reduction",
    weatherConditions: ["Clouds", "Rain"],
    prices: [gbp("R", 15.5)],
    popularity: 35,
    trend: -0.1,
    season: null,
  },
  {
    type: "Grill",
    name: "Malai Boti",
    description: "Cream-marinated chicken boti from the grill. Soft and mildly spiced.",
    ingredients: ["chicken", "cream", "cheese", "cardamom"],
    special_ingredient: "Charcoal malai marinade",
    weatherConditions: ["Clear", "Clouds"],
    prices: [gbp("R", 11.9)],
    popularity: 42,
    trend: 0.25,
    season: null,
  },
  {
    type: "Grill",
    name: "Mixed Grill Platter",
    description: "Seekh, malai boti, chicken tikka and lamb chops for the table.",
    ingredients: ["chicken", "beef", "lamb", "mint chutney"],
    special_ingredient: "Tandoor smoke",
    weatherConditions: ["Clear"],
    prices: [gbp("R", 24.9)],
    popularity: 22,
    trend: 0.5,
    season: "warm",
  },
  {
    type: "Biryani & Rice",
    name: "Chicken Biryani",
    description: "Dum-cooked basmati with fried onions, saffron and potato.",
    ingredients: ["basmati", "chicken", "potato", "saffron"],
    special_ingredient: "Kewra water",
    weatherConditions: ["Clouds", "Clear", "Rain"],
    prices: [gbp("S", 7.9), gbp("M", 10.5), gbp("L", 13.5)],
    popularity: 95,
    trend: 0.1,
    season: null,
  },
  {
    type: "Biryani & Rice",
    name: "Beef Biryani",
    description: "Slow-cooked beef biryani with whole spices and browned onions.",
    ingredients: ["basmati", "beef", "fried onion", "yoghurt"],
    special_ingredient: "Mutton stock",
    weatherConditions: ["Clouds", "Rain"],
    prices: [gbp("S", 8.9), gbp("M", 11.5), gbp("L", 14.5)],
    popularity: 32,
    trend: -0.15,
    season: null,
  },
  {
    type: "Breads",
    name: "Garlic Naan",
    description: "Tandoor naan brushed with garlic butter and coriander.",
    ingredients: ["flour", "garlic", "butter", "coriander"],
    special_ingredient: "Tandoor blister",
    weatherConditions: ["Clouds", "Rain", "Clear"],
    prices: [gbp("R", 2.2)],
    popularity: 90,
    trend: 0.05,
    season: null,
  },
  {
    type: "Breads",
    name: "Roghni Naan",
    description: "Soft sesame naan, the usual partner for karahi and nihari.",
    ingredients: ["flour", "sesame", "milk", "ghee"],
    special_ingredient: "Nigella seed",
    weatherConditions: ["Clouds", "Rain"],
    prices: [gbp("R", 2.6)],
    popularity: 48,
    trend: -0.05,
    season: null,
  },
  {
    type: "Desserts",
    name: "Gulab Jamun",
    description: "Warm milk-solid dumplings in cardamom syrup.",
    ingredients: ["khoya", "sugar syrup", "cardamom", "rose"],
    special_ingredient: "Saffron syrup",
    weatherConditions: ["Clouds", "Rain"],
    prices: [gbp("R", 4.2)],
    popularity: 30,
    trend: 0.05,
    season: "cold",
  },
  {
    type: "Desserts",
    name: "Kashmiri Kheer",
    description: "Slow rice pudding with almonds, pistachios and green cardamom.",
    ingredients: ["rice", "milk", "pistachio", "cardamom"],
    special_ingredient: "Condensed milk",
    weatherConditions: ["Clouds", "Rain", "Fog"],
    prices: [gbp("R", 4.5)],
    popularity: 14,
    trend: -0.1,
    season: "cold",
  },
  {
    type: "Desserts",
    name: "Molten Lava Cake",
    description: "Dark chocolate cake with a warm centre, vanilla ice cream on the side.",
    ingredients: ["dark chocolate", "butter", "egg", "vanilla ice cream"],
    special_ingredient: "Valrhona centre",
    weatherConditions: ["Clear", "Clouds"],
    prices: [gbp("R", 6.5)],
    popularity: 13,
    trend: 0.6,
    season: null,
  },
  {
    type: "Hot Drinks",
    name: "Karak Chai",
    description: "Strong milk tea, boiled down the Pakistani way.",
    ingredients: ["tea", "milk", "cardamom", "sugar"],
    special_ingredient: "Loose leaf blend",
    weatherConditions: ["Rain", "Clouds", "Fog", "Thunderstorm"],
    prices: [gbp("S", 2.2), gbp("M", 2.7), gbp("L", 3.2)],
    popularity: 70,
    trend: 0.05,
    season: "cold",
  },
  {
    type: "Hot Drinks",
    name: "Kashmiri Pink Chai",
    description: "Salted pink tea with pistachios. Made for cold, grey afternoons.",
    ingredients: ["green tea", "milk", "bicarbonate", "pistachio"],
    special_ingredient: "Himalayan salt",
    weatherConditions: ["Rain", "Clouds", "Snow", "Fog"],
    prices: [gbp("S", 2.9), gbp("M", 3.4), gbp("L", 3.9)],
    popularity: 9,
    trend: -0.4,
    season: "cold",
  },
  {
    type: "Hot Drinks",
    name: "Cappuccino",
    description: "Double espresso with steamed milk and a thick foam.",
    ingredients: ["espresso", "milk", "foam"],
    special_ingredient: "House espresso blend",
    weatherConditions: ["Clouds", "Rain", "Clear"],
    prices: [gbp("S", 2.9), gbp("M", 3.4), gbp("L", 3.9)],
    popularity: 16,
    trend: 0.2,
    season: "cold",
  },
  {
    type: "Cold Drinks",
    name: "Mint Lemonade",
    description: "Fresh lemon, mint and soda over ice.",
    ingredients: ["lemon", "mint", "soda", "sugar"],
    special_ingredient: "Crushed ice",
    weatherConditions: ["Clear"],
    prices: [gbp("S", 2.8), gbp("M", 3.4), gbp("L", 3.9)],
    popularity: 28,
    trend: 0.15,
    season: "warm",
  },
  {
    type: "Cold Drinks",
    name: "Mango Lassi",
    description: "Chaunsa mango blended with yoghurt. The summer cooler.",
    ingredients: ["mango", "yoghurt", "cardamom", "sugar"],
    special_ingredient: "Chaunsa pulp",
    weatherConditions: ["Clear"],
    prices: [gbp("S", 3.5), gbp("M", 4.2), gbp("L", 4.9)],
    popularity: 40,
    trend: 0.4,
    season: "warm",
  },
  {
    type: "Cold Drinks",
    name: "Iced Latte",
    description: "Espresso over cold milk and ice.",
    ingredients: ["espresso", "milk", "ice"],
    special_ingredient: "Cold brew shot",
    weatherConditions: ["Clear"],
    prices: [gbp("S", 3.2), gbp("M", 3.8), gbp("L", 4.4)],
    popularity: 11,
    trend: 0.9,
    season: "warm",
  },
  {
    type: "Cold Drinks",
    name: "Fresh Lime Soda",
    description: "Sweet, salt or mixed — the classic Pakistani soda.",
    ingredients: ["lime", "soda", "salt", "sugar"],
    special_ingredient: "Black salt",
    weatherConditions: ["Clear"],
    prices: [gbp("S", 2.4), gbp("M", 2.9), gbp("L", 3.4)],
    popularity: 18,
    trend: 0.05,
    season: "warm",
  },
];

const TABLES = [
  { number: 1, capacity: 2 },
  { number: 2, capacity: 2 },
  { number: 3, capacity: 4 },
  { number: 4, capacity: 4 },
  { number: 5, capacity: 4 },
  { number: 6, capacity: 6 },
  { number: 7, capacity: 6 },
  { number: 8, capacity: 6 },
  { number: 9, capacity: 8 },
  { number: 10, capacity: 8 },
  { number: 11, capacity: 10 },
  { number: 12, capacity: 10 },
];

const FEEDBACK_NOTES = [
  { rating: 5, text: "Karahi was exactly how my mother makes it. Naan came out hot. Will be back this Friday." },
  { rating: 5, text: "Booked a table for six — staff seated us on time and the mixed grill was generous." },
  { rating: 4, text: "Biryani was fragrant and the meat was tender. Delivery took a little longer than promised." },
  { rating: 5, text: "Came in from the rain, ordered corn soup and karak chai. Perfect pairing." },
  { rating: 3, text: "Food was good but the nihari arrived lukewarm. Manager did send a fresh bowl." },
  { rating: 5, text: "Best mango lassi I have had in Manchester. Kids loved the lava cake too." },
  { rating: 4, text: "Malai boti was melt-in-mouth. Would like a spicier option on the grill menu." },
  { rating: 5, text: "Reserved online, got a confirmation on the app, and the table was ready. Smooth." },
  { rating: 2, text: "Order mix-up on delivery — we got handi instead of karahi. Replaced the next day though." },
  { rating: 5, text: "Daal mash tadka with roghni naan is now our weekly order." },
  { rating: 4, text: "Cappuccino was excellent. Parking on the high street is still a pain, not your fault." },
  { rating: 5, text: "Staff were polite and the fattoush was actually fresh, not soggy." },
  { rating: 3, text: "Busy Saturday night, waited 20 minutes after sitting. Food made up for it." },
  { rating: 5, text: "Nihari on a foggy morning — this is why we keep coming back." },
  { rating: 4, text: "App weather suggestions showed soup on a rainy day. Nice touch, we ordered it." },
  { rating: 5, text: "Family dinner of 8 at table 10. Service was organised and the platter was huge." },
  { rating: 4, text: "Iced latte was strong enough. Would add a sugar-free syrup option." },
  { rating: 5, text: "Seekh kebab had proper charcoal flavour, not just oven-baked." },
  { rating: 5, text: "Gulab jamun were warm, not fridge-cold. Small thing, big difference." },
  { rating: 3, text: "Lime soda was too sweet. Asked for salty-mix next time." },
  { rating: 5, text: "Handed a high-chair without us asking. That is good restaurant sense." },
  { rating: 4, text: "Butter chicken is rich — split it between two people. Naan is a must." },
  { rating: 5, text: "Used the app to book 19:00. Confirmed within an hour. No phone tag." },
  { rating: 4, text: "Delivery packaging held the gravy well. No leaks, surprisingly." },
  { rating: 5, text: "Kashmiri chai on a grey afternoon. Reminded me of winters back home." },
  { rating: 2, text: "One naan was undercooked. Rest of the karahi order was fine." },
  { rating: 5, text: "Grilled fish was not dry — rare for a curry house. Well done." },
  { rating: 4, text: "Would love a kids portion of biryani. We currently split a small." },
  { rating: 5, text: "Staff remembered our usual table. That is why we do not go elsewhere." },
  { rating: 4, text: "Peak Friday dinner was loud but food came out in good time." },
  { rating: 5, text: "Pink chai and kheer after nihari. Closing the meal properly." },
  { rating: 3, text: "App showed a table as free that was already taken. Host sorted it quickly." },
  { rating: 5, text: "Pakora starter with corn soup during a downpour. Comfort food done right." },
  { rating: 4, text: "Prices are a bit high for daal but the tadka is worth it." },
  { rating: 5, text: "Clean glasses, hot plates, no rush to turn the table. Feels like a real dining room." },
];

const REPLIES = [
  "Thank you for dining with us — we have shared this with the kitchen team.",
  "Glad the booking flow worked smoothly. We hope to host you again soon.",
  "Sorry about the wait. We have added a runner on Friday dinner service.",
  "We replaced the mix-up and logged it with dispatch so it does not happen again.",
  "Thank you for the note on the weather suggestions — that is exactly why we built them.",
];

// ---------------------------------------------------------------------------
// Demand shape
// ---------------------------------------------------------------------------

const SERVICE_HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

// Share of a day's covers landing in each trading hour. Weekends start slower
// and run later. Both profiles sum to 1.
const PROFILE_WEEKDAY = {
  11: 0.02, 12: 0.085, 13: 0.115, 14: 0.075, 15: 0.035, 16: 0.03,
  17: 0.055, 18: 0.11, 19: 0.16, 20: 0.145, 21: 0.115, 22: 0.055,
};
const PROFILE_WEEKEND = {
  11: 0.03, 12: 0.07, 13: 0.10, 14: 0.09, 15: 0.05, 16: 0.04,
  17: 0.06, 18: 0.10, 19: 0.15, 20: 0.15, 21: 0.11, 22: 0.05,
};

// Sunday-indexed. Friday and Saturday carry the week.
const WEEKDAY_FACTOR = [0.95, 0.76, 0.80, 0.86, 0.96, 1.30, 1.36];

const BASE_COVERS = 40;
const GROWTH = 0.28; // the restaurant grows this much across the window

/** Seasonal wave, +1 deep winter through -1 high summer. */
const coldness = (date) => {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000);
  return Math.cos((2 * Math.PI * (dayOfYear - 15)) / 365);
};

const itemWeight = (item, progress, cold) => {
  let weight = item.popularity * (1 + (item.trend || 0) * progress);
  if (item.season === "cold") weight *= 1 + 0.45 * cold;
  if (item.season === "warm") weight *= 1 - 0.45 * cold;
  return Math.max(0.5, weight);
};

const weightedPick = (rng, entries) => {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.item;
  }
  return entries[entries.length - 1].item;
};

const pickPrice = (rng, item) => {
  const option = pick(rng, item.prices);
  return { name: item.name, image: item.image, price: option.price, size: option.size };
};

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Build a plausible basket: a centre plate or two, then the things people
 * actually add alongside. Sampling every line uniformly from the whole menu
 * would flatten item popularity and leave nothing for the demand model to learn.
 */
const buildCart = (rng, groups, progress, cold) => {
  const cart = [];
  const take = (group, quantityMax = 1) => {
    const entries = groups[group];
    if (!entries || !entries.length) return;
    const item = weightedPick(
      rng,
      entries.map((entry) => ({ item: entry, weight: itemWeight(entry, progress, cold) }))
    );
    const line = pickPrice(rng, item);
    cart.push({ ...line, quantity: quantityMax > 1 ? randInt(rng, 1, quantityMax) : 1 });
  };

  const centres = randInt(rng, 1, 2);
  for (let i = 0; i < centres; i += 1) take("centre");
  if (rng() < 0.62) take("Breads", 3);
  if (rng() < 0.44) take("opener");
  if (rng() < 0.56) take("drink");
  if (rng() < 0.24) take("Desserts");
  if (!cart.length) take("centre");
  return cart;
};

const cartTotal = (cart) => round2(cart.reduce((sum, line) => sum + line.price * line.quantity, 0));

const statusFor = (rng, timestamp, now) => {
  if (timestamp > now) return "Pending";
  const hoursAgo = (now.getTime() - timestamp.getTime()) / 36e5;
  if (hoursAgo < 1.5) return rng() < 0.55 ? "Pending" : "Accepted";
  if (hoursAgo < 10) {
    const roll = rng();
    if (roll < 0.12) return "Pending";
    if (roll < 0.38) return "Accepted";
    return "Completed";
  }
  return "Completed";
};

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(process.env.MONGO_URI, { dbName: "Skyplate" });
  const rng = mulberry32(SEED);
  const now = new Date();

  await Promise.all([
    ItemType.deleteMany({}),
    FoodItem.deleteMany({}),
    Table.deleteMany({}),
    Booking.deleteMany({}),
    Feedback.deleteMany({}),
    Order.deleteMany({}),
  ]);

  const missingImages = MENU.filter((item) => !foodPhoto(item.name).url).map((item) => item.name);
  if (missingImages.length) {
    throw new Error(`seedImages.js has no photo for: ${missingImages.join(", ")}`);
  }

  const types = await ItemType.insertMany(TYPE_NAMES.map((name) => ({ name })));
  const typeByName = Object.fromEntries(types.map((type) => [type.name, type._id]));

  const foods = await FoodItem.insertMany(
    MENU.map((item) => ({
      name: item.name,
      description: item.description,
      type: typeByName[item.type],
      ingredients: item.ingredients,
      special_ingredient: item.special_ingredient,
      weatherConditions: item.weatherConditions,
      image: foodPhoto(item.name),
      prices: item.prices,
    }))
  );

  const catalog = foods.map((food, index) => ({
    ...MENU[index],
    _id: food._id,
    image: foodPhoto(MENU[index].name).url,
  }));

  const byType = (name) => catalog.filter((item) => item.type === name);
  const groups = {
    centre: [...byType("Mains"), ...byType("Grill"), ...byType("Biryani & Rice"), ...byType("Salads")],
    opener: [...byType("Starters"), ...byType("Soups")],
    drink: [...byType("Hot Drinks"), ...byType("Cold Drinks")],
    Breads: byType("Breads"),
    Desserts: byType("Desserts"),
  };

  const tables = await Table.insertMany(TABLES);

  const slotCount = await TimeSlot.countDocuments();
  if (slotCount === 0) {
    await TimeSlot.insertMany(
      Array.from({ length: 11 }, (_, i) => {
        const time = `${pad(i + 12)}:00`;
        return { time, enabled: true, sortOrder: (i + 12) * 60 };
      })
    );
  }

  const occupied = new Set();
  const orders = [];
  const bookings = [];

  const pushOrder = ({ timestamp, dineIn, statusOverride, progress, cold }) => {
    const customer = pick(rng, CUSTOMERS);
    const cart = buildCart(rng, groups, progress, cold);
    const status = statusOverride || statusFor(rng, timestamp, now);
    const orderType = dineIn ? "Dine In" : "Delivery";

    const doc = {
      email: customer.email,
      phone: customer.phone,
      cartItems: cart,
      orderType,
      status,
      total: cartTotal(cart),
      payment: "Pay With Card",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (orderType === "Delivery") {
      doc.address = customer.address;
    } else {
      const slotKey = `${formatDate(timestamp)}|${formatTime(timestamp)}`;
      const freeTables = tables.filter((table) => !occupied.has(`${slotKey}|${table.number}`));
      const table = pick(rng, freeTables.length ? freeTables : tables);
      const people = Math.max(1, Math.min(table.capacity, randInt(rng, 2, table.capacity)));
      occupied.add(`${slotKey}|${table.number}`);
      doc.tableNumber = table.number;
      doc.people = people;
      doc.date = formatDate(timestamp);
      doc.time = formatTime(timestamp);

      const bookingId = new mongoose.Types.ObjectId();
      bookings.push({
        _id: bookingId,
        tableNumber: table.number,
        date: doc.date,
        time: doc.time,
        people,
        email: customer.email,
        status: status === "Pending" ? "Pending" : "Confirmed",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      doc.bookingid = String(bookingId);
    }

    orders.push(doc);
  };

  const today = zoneParts(now);
  let shock = 0;

  for (let dayOffset = DAYS; dayOffset >= 0; dayOffset -= 1) {
    const anchor = new Date(Date.UTC(today.year, today.month - 1, today.day) - dayOffset * 86400000);
    const y = anchor.getUTCFullYear();
    const m = anchor.getUTCMonth() + 1;
    const d = anchor.getUTCDate();

    const progress = (DAYS - dayOffset) / DAYS;
    const cold = coldness(anchor);
    const weekday = anchor.getUTCDay();
    const weekend = weekday === 0 || weekday === 6;

    // A slow-moving shock stands in for weather and local events. Independent
    // draws per day would leave the lag and rolling-mean features with nothing
    // to lock onto, which is what caps the model's explanatory power.
    shock = 0.72 * shock + 0.5 * gaussian(rng);
    const shockFactor = clamp(1 + 0.12 * shock, 0.70, 1.35);
    const seasonFactor = 1 - 0.10 * cold; // summer runs a little busier

    const covers =
      BASE_COVERS *
      (1 + GROWTH * progress) *
      WEEKDAY_FACTOR[weekday] *
      seasonFactor *
      shockFactor;

    const profile = weekend ? PROFILE_WEEKEND : PROFILE_WEEKDAY;

    for (const hour of SERVICE_HOURS) {
      const expected = covers * profile[hour];
      // sqrt-scaled noise keeps arrivals looking Poisson rather than fixed
      const count = Math.max(0, Math.round(expected + gaussian(rng) * Math.sqrt(Math.max(expected, 1)) * 0.6));
      for (let i = 0; i < count; i += 1) {
        const timestamp = zonedTime(y, m, d, hour, randInt(rng, 0, 59), randInt(rng, 0, 59));
        if (timestamp > now) continue;
        pushOrder({ timestamp, dineIn: rng() < 0.42, progress, cold });
      }
    }
  }

  const liveQueue = [
    { dineIn: false, status: "Pending", minutesAgo: 18 },
    { dineIn: false, status: "Pending", minutesAgo: 32 },
    { dineIn: false, status: "Pending", minutesAgo: 47 },
    { dineIn: false, status: "Pending", minutesAgo: 8 },
    { dineIn: false, status: "Pending", minutesAgo: 61 },
    { dineIn: false, status: "Pending", minutesAgo: 14 },
    { dineIn: false, status: "Accepted", minutesAgo: 25 },
    { dineIn: false, status: "Accepted", minutesAgo: 40 },
    { dineIn: false, status: "Accepted", minutesAgo: 55 },
    { dineIn: false, status: "Accepted", minutesAgo: 12 },
    { dineIn: false, status: "Accepted", minutesAgo: 70 },
    { dineIn: true, status: "Pending", minutesAgo: 10 },
    { dineIn: true, status: "Pending", minutesAgo: 22 },
    { dineIn: true, status: "Pending", minutesAgo: 36 },
    { dineIn: true, status: "Pending", minutesAgo: 5 },
    { dineIn: true, status: "Accepted", minutesAgo: 28 },
    { dineIn: true, status: "Accepted", minutesAgo: 44 },
    { dineIn: true, status: "Accepted", minutesAgo: 16 },
    { dineIn: true, status: "Accepted", minutesAgo: 52 },
  ];

  for (const ticket of liveQueue) {
    pushOrder({
      timestamp: new Date(now.getTime() - ticket.minutesAgo * 60 * 1000),
      dineIn: ticket.dineIn,
      statusOverride: ticket.status,
      progress: 1,
      cold: coldness(now),
    });
  }

  for (let i = 0; i < 6; i += 1) {
    const anchor = new Date(Date.UTC(today.year, today.month - 1, today.day) + i * 86400000);
    for (const hour of [13, 14, 19, 20, 21]) {
      if (rng() > 0.55) continue;
      const customer = pick(rng, CUSTOMERS);
      const table = pick(rng, tables);
      const when = zonedTime(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, anchor.getUTCDate(), hour);
      const key = `${formatDate(when)}|${formatTime(when)}|${table.number}`;
      if (occupied.has(key)) continue;
      occupied.add(key);
      const roll = rng();
      bookings.push({
        tableNumber: table.number,
        date: formatDate(when),
        time: formatTime(when),
        people: randInt(rng, 2, table.capacity),
        email: customer.email,
        status: when < now ? "Confirmed" : roll < 0.15 ? "Cancelled" : roll < 0.45 ? "Pending" : "Confirmed",
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const insertChunked = async (model, docs) => {
    for (let i = 0; i < docs.length; i += 2000) {
      await model.collection.insertMany(docs.slice(i, i + 2000), { ordered: false });
    }
  };

  await insertChunked(Booking, bookings);
  await insertChunked(Order, orders);

  const feedbackDocs = FEEDBACK_NOTES.map((note, index) => {
    const customer = CUSTOMERS[index % CUSTOMERS.length];
    const completed = note.rating >= 4 && rng() < 0.55;
    return {
      firstname: customer.firstname,
      phone: customer.phone,
      email: customer.email,
      feedback: note.text,
      rating: note.rating,
      image: "",
      completed,
      response: completed ? pick(rng, REPLIES) : "",
    };
  });
  await Feedback.insertMany(feedbackDocs);

  const orderStats = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const typeStats = await Order.aggregate([{ $group: { _id: "$orderType", count: { $sum: 1 } } }]);
  const hourStats = await Order.aggregate([
    { $group: { _id: { $hour: { date: "$createdAt", timezone: TZ } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const oldest = await Order.findOne({}).sort({ createdAt: 1 }).select("createdAt");
  const newest = await Order.findOne({}).sort({ createdAt: -1 }).select("createdAt");

  console.log("Seed complete. Users collection was not modified.");
  console.log(`item types: ${types.length}`);
  console.log(`menu items: ${foods.length}`);
  console.log(`tables: ${tables.length}`);
  console.log(`orders: ${orders.length}`);
  console.log(`bookings: ${bookings.length}`);
  console.log(`feedback: ${feedbackDocs.length}`);
  console.log("order status:", Object.fromEntries(orderStats.map((row) => [row._id, row.count])));
  console.log("order types:", Object.fromEntries(typeStats.map((row) => [row._id, row.count])));
  console.log(`order range: ${oldest?.createdAt?.toISOString()} -> ${newest?.createdAt?.toISOString()}`);
  console.log(
    `hours (${TZ}):`,
    hourStats.map((row) => `${pad(row._id)}=${row.count}`).join(" ")
  );

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
