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

config();

const DAYS = 90;
const SEED = 20260829;

const pad = (value) => String(value).padStart(2, "0");
const formatDate = (date) => `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
const formatTime = (date) => `${pad(date.getHours())}:00`;

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const randInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

const photo = () => foodPhoto("Chicken Pakora");

const CUSTOMERS = [
  { firstname: "Ahmed", lastname: "Khan", email: "ahmed.khan.lhr@gmail.com", phone: "0300-4512789", address: "House 14, Street 7, DHA Phase 5, Lahore" },
  { firstname: "Fatima", lastname: "Malik", email: "fatima.malik88@gmail.com", phone: "0321-8891204", address: "22-A Gulberg III, Lahore" },
  { firstname: "Hassan", lastname: "Raza", email: "hassan.raza.pk@gmail.com", phone: "0333-5678123", address: "Flat 8, Askari 11, Lahore" },
  { firstname: "Ayesha", lastname: "Siddiqui", email: "ayesha.siddiqui21@gmail.com", phone: "0312-7780345", address: "House 3, Block C, Model Town, Lahore" },
  { firstname: "Usman", lastname: "Ali", email: "usman.ali.orders@gmail.com", phone: "0301-2234098", address: "19 Garden Town, Lahore" },
  { firstname: "Zainab", lastname: "Iqbal", email: "zainab.iqbal.lhr@gmail.com", phone: "0345-9012678", address: "House 41, Johar Town, Lahore" },
  { firstname: "Bilal", lastname: "Ahmed", email: "bilal.ahmed.food@gmail.com", phone: "0322-4451780", address: "Street 12, Wapda Town, Lahore" },
  { firstname: "Sara", lastname: "Nawaz", email: "sara.nawaz07@gmail.com", phone: "0316-7802341", address: "House 9, Valencia Town, Lahore" },
  { firstname: "Omar", lastname: "Sheikh", email: "omar.sheikh.lhr@gmail.com", phone: "0308-1123987", address: "45 MM Alam Road, Gulberg, Lahore" },
  { firstname: "Hira", lastname: "Shah", email: "hira.shah.eats@gmail.com", phone: "0334-6671290", address: "House 18, Bahria Town Sector C, Lahore" },
  { firstname: "Hamza", lastname: "Tariq", email: "hamza.tariq.pk@gmail.com", phone: "0305-3348210", address: "11 Cavalry Ground, Lahore" },
  { firstname: "Noor", lastname: "Fatima", email: "noor.fatima.dine@gmail.com", phone: "0311-9980456", address: "House 27, Township Sector A1, Lahore" },
  { firstname: "Ali", lastname: "Haider", email: "ali.haider.lhr@gmail.com", phone: "0321-5567093", address: "8-B Faisal Town, Lahore" },
  { firstname: "Maryam", lastname: "Javed", email: "maryam.javed22@gmail.com", phone: "0342-8711204", address: "House 5, Shadman 1, Lahore" },
  { firstname: "Zeeshan", lastname: "Butt", email: "zeeshan.butt.orders@gmail.com", phone: "0300-7782456", address: "33 Allama Iqbal Town, Lahore" },
  { firstname: "Sana", lastname: "Qureshi", email: "sana.qureshi.lhr@gmail.com", phone: "0333-1209876", address: "House 16, DHA Phase 6, Lahore" },
  { firstname: "Ibrahim", lastname: "Dar", email: "ibrahim.dar.food@gmail.com", phone: "0315-4432189", address: "2 Canal Park, Gulberg II, Lahore" },
  { firstname: "Amina", lastname: "Rashid", email: "amina.rashid.pk@gmail.com", phone: "0324-6678901", address: "House 70, Sabzazar, Lahore" },
  { firstname: "Taha", lastname: "Mehmood", email: "taha.mehmood.lhr@gmail.com", phone: "0302-9912345", address: "14 Jail Road, Lahore" },
  { firstname: "Laiba", lastname: "Anwar", email: "laiba.anwar.eats@gmail.com", phone: "0317-3345678", address: "House 11, Lake City, Lahore" },
  { firstname: "Farhan", lastname: "Saeed", email: "farhan.saeed.dine@gmail.com", phone: "0348-2210987", address: "6-C Muslim Town, Lahore" },
  { firstname: "Iqra", lastname: "Yousaf", email: "iqra.yousaf.lhr@gmail.com", phone: "0306-7788123", address: "House 23, Eden Value Homes, Lahore" },
  { firstname: "Shahzaib", lastname: "Aslam", email: "shahzaib.aslam.pk@gmail.com", phone: "0331-4456098", address: "9 Ferozepur Road, Lahore" },
  { firstname: "Mahnoor", lastname: "Aziz", email: "mahnoor.aziz.food@gmail.com", phone: "0320-8891674", address: "House 4, PCSIR Staff Colony, Lahore" },
  { firstname: "Rehan", lastname: "Mir", email: "rehan.mir.orders@gmail.com", phone: "0304-1122567", address: "17 Empirium Mall Apartments, Lahore" },
  { firstname: "Hafsa", lastname: "Kamal", email: "hafsa.kamal.lhr@gmail.com", phone: "0313-6677432", address: "House 31, Sui Gas Housing Society, Lahore" },
  { firstname: "Danish", lastname: "Nadeem", email: "danish.nadeem.pk@gmail.com", phone: "0341-9901234", address: "12-A PIA Housing Society, Lahore" },
  { firstname: "Anaya", lastname: "Farooq", email: "anaya.farooq.eats@gmail.com", phone: "0307-2233889", address: "House 8, Askari 10, Lahore" },
  { firstname: "Junaid", lastname: "Akram", email: "junaid.akram.dine@gmail.com", phone: "0325-7788001", address: "5 Main Boulevard, DHA Phase 4, Lahore" },
  { firstname: "Rida", lastname: "Hassan", email: "rida.hassan.lhr@gmail.com", phone: "0335-4411290", address: "House 19, Garden Town Block H, Lahore" },
  { firstname: "Saad", lastname: "Chaudhry", email: "saad.chaudhry.food@gmail.com", phone: "0318-5566123", address: "27 MM Alam Road, Lahore" },
  { firstname: "Emaan", lastname: "Zahid", email: "emaan.zahid.pk@gmail.com", phone: "0309-3344771", address: "House 2, Paragon City, Lahore" },
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

const MENU = [
  {
    type: "Starters",
    name: "Chicken Pakora",
    description: "Crisp gram-flour fritters with mint chutney. A rainy-day favourite with karak chai.",
    ingredients: ["chicken", "gram flour", "spices", "mint chutney"],
    special_ingredient: "Ajwain tempering",
    weatherConditions: ["Rain", "Clouds"],
    prices: [{ size: "R", price: 490, currency: "Rs" }],
    image: photo("1601050690597-df0568ab59c1"),
  },
  {
    type: "Starters",
    name: "Seekh Kebab Platter",
    description: "Charcoal-grilled minced kebab with onions, lemon and raita.",
    ingredients: ["beef mince", "papaya", "chillies", "raita"],
    special_ingredient: "Smoked charcoal finish",
    weatherConditions: ["Clouds", "Clear"],
    prices: [{ size: "R", price: 890, currency: "Rs" }],
    image: photo("1599487488170-d11ec9c172f0"),
  },
  {
    type: "Starters",
    name: "Dynamite Prawns",
    description: "Crispy prawns tossed in a sweet-chilli mayo. Light enough for warm evenings.",
    ingredients: ["prawns", "mayo", "chilli sauce", "spring onion"],
    special_ingredient: "House dynamite sauce",
    weatherConditions: ["Clear"],
    prices: [{ size: "R", price: 1290, currency: "Rs" }],
    image: photo("1559737558-2f3a1b548519"),
  },
  {
    type: "Soups",
    name: "Chicken Corn Soup",
    description: "A Lahore classic — silky stock, sweet corn and shredded chicken.",
    ingredients: ["chicken", "sweet corn", "egg drop", "stock"],
    special_ingredient: "White pepper finish",
    weatherConditions: ["Rain", "Clouds", "Thunderstorm"],
    prices: [
      { size: "S", price: 320, currency: "Rs" },
      { size: "M", price: 420, currency: "Rs" },
      { size: "L", price: 520, currency: "Rs" },
    ],
    image: photo("1547592166-23ac45744acd"),
  },
  {
    type: "Soups",
    name: "Hot & Sour Soup",
    description: "Tangy broth with vegetables and chicken. Best when the weather turns.",
    ingredients: ["chicken", "vinegar", "soya", "vegetables"],
    special_ingredient: "Chilli-vinegar oil",
    weatherConditions: ["Rain", "Clouds"],
    prices: [
      { size: "S", price: 340, currency: "Rs" },
      { size: "M", price: 440, currency: "Rs" },
      { size: "L", price: 540, currency: "Rs" },
    ],
    image: photo("1574484284002-952d92456975"),
  },
  {
    type: "Soups",
    name: "Cream of Mushroom",
    description: "Slow-simmered mushrooms with cream and thyme.",
    ingredients: ["mushroom", "cream", "garlic", "thyme"],
    special_ingredient: "Truffle oil drizzle",
    weatherConditions: ["Rain", "Clouds", "Fog"],
    prices: [
      { size: "S", price: 380, currency: "Rs" },
      { size: "M", price: 490, currency: "Rs" },
      { size: "L", price: 590, currency: "Rs" },
    ],
    image: photo("1476718406336-bb5a5b0b8d1d"),
  },
  {
    type: "Salads",
    name: "Caesar Salad",
    description: "Crisp romaine, parmesan, croutons and house Caesar dressing.",
    ingredients: ["romaine", "parmesan", "croutons", "anchovy dressing"],
    special_ingredient: "Soft-boiled egg",
    weatherConditions: ["Clear"],
    prices: [{ size: "R", price: 750, currency: "Rs" }],
    image: photo("1540189549336-e6e99c3679fe"),
  },
  {
    type: "Salads",
    name: "Fattoush",
    description: "Levantine salad with toasted pita, sumac and pomegranate molasses.",
    ingredients: ["lettuce", "tomato", "cucumber", "pita", "sumac"],
    special_ingredient: "Pomegranate molasses",
    weatherConditions: ["Clear"],
    prices: [{ size: "R", price: 690, currency: "Rs" }],
    image: photo("1546069901-ba9599a7e63c"),
  },
  {
    type: "Mains",
    name: "Chicken Karahi",
    description: "Wok-tossed chicken in tomato, ginger and green chilli. Served with naan.",
    ingredients: ["chicken", "tomato", "ginger", "green chilli"],
    special_ingredient: "Kasuri methi",
    weatherConditions: ["Rain", "Clouds"],
    prices: [{ size: "R", price: 1650, currency: "Rs" }],
    image: photo("1585937421612-70a008356fbe"),
  },
  {
    type: "Mains",
    name: "Beef Nihari",
    description: "Overnight-slow nihari with bone marrow, julienne ginger and garam masala.",
    ingredients: ["beef shank", "nihari masala", "ginger", "naan"],
    special_ingredient: "Bone marrow tadka",
    weatherConditions: ["Rain", "Clouds", "Fog"],
    prices: [{ size: "R", price: 1490, currency: "Rs" }],
    image: photo("1631452180519-5b57d1f1e318"),
  },
  {
    type: "Mains",
    name: "Butter Chicken",
    description: "Tandoori chicken simmered in a silky tomato-butter gravy.",
    ingredients: ["chicken", "tomato", "butter", "cream"],
    special_ingredient: "Dried fenugreek",
    weatherConditions: ["Clouds", "Clear"],
    prices: [{ size: "R", price: 1390, currency: "Rs" }],
    image: photo("1603894584373-5ac82b2ad761"),
  },
  {
    type: "Mains",
    name: "Daal Mash Tadka",
    description: "Creamy white lentils finished with garlic, chilli and ghee.",
    ingredients: ["maash daal", "ghee", "garlic", "chilli"],
    special_ingredient: "Smoked ghee tadka",
    weatherConditions: ["Rain", "Clouds"],
    prices: [{ size: "R", price: 720, currency: "Rs" }],
    image: photo("1546833999-b9f581a1996d"),
  },
  {
    type: "Mains",
    name: "Grilled Fish",
    description: "Masala-marinated fish fillet with lemon butter and garden salad.",
    ingredients: ["fish fillet", "lemon", "garlic", "salad"],
    special_ingredient: "Charcoal lemon butter",
    weatherConditions: ["Clear"],
    prices: [{ size: "R", price: 1890, currency: "Rs" }],
    image: photo("1519708227418-c8fd9a32b7a2"),
  },
  {
    type: "Mains",
    name: "Chicken Handi",
    description: "Yoghurt-based handi with cream, green chilli and coriander.",
    ingredients: ["chicken", "yoghurt", "cream", "green chilli"],
    special_ingredient: "Handi reduction",
    weatherConditions: ["Clouds", "Rain"],
    prices: [{ size: "R", price: 1550, currency: "Rs" }],
    image: photo("1604908176997-125f25cc6ec9"),
  },
  {
    type: "Grill",
    name: "Malai Boti",
    description: "Cream-marinated chicken boti from the grill. Soft and mildly spiced.",
    ingredients: ["chicken", "cream", "cheese", "cardamom"],
    special_ingredient: "Charcoal malai marinade",
    weatherConditions: ["Clear", "Clouds"],
    prices: [{ size: "R", price: 1190, currency: "Rs" }],
    image: photo("1600891964599-f539ba387b09"),
  },
  {
    type: "Grill",
    name: "Mixed Grill Platter",
    description: "Seekh, malai boti, chicken tikka and lamb chops for the table.",
    ingredients: ["chicken", "beef", "lamb", "mint chutney"],
    special_ingredient: "Tandoor smoke",
    weatherConditions: ["Clear"],
    prices: [{ size: "R", price: 2490, currency: "Rs" }],
    image: photo("1555939594-58d7cb561ad1"),
  },
  {
    type: "Biryani & Rice",
    name: "Chicken Biryani",
    description: "Dum-cooked basmati with fried onions, saffron and potato.",
    ingredients: ["basmati", "chicken", "potato", "saffron"],
    special_ingredient: "Kewra water",
    weatherConditions: ["Clouds", "Clear", "Rain"],
    prices: [
      { size: "S", price: 590, currency: "Rs" },
      { size: "M", price: 790, currency: "Rs" },
      { size: "L", price: 990, currency: "Rs" },
    ],
    image: photo("1631515243349-eaa35d50da82"),
  },
  {
    type: "Biryani & Rice",
    name: "Beef Biryani",
    description: "Slow-cooked beef biryani with whole spices and browned onions.",
    ingredients: ["basmati", "beef", "fried onion", "yoghurt"],
    special_ingredient: "Mutton stock",
    weatherConditions: ["Clouds", "Rain"],
    prices: [
      { size: "S", price: 690, currency: "Rs" },
      { size: "M", price: 890, currency: "Rs" },
      { size: "L", price: 1090, currency: "Rs" },
    ],
    image: photo("1589308078052-83044c6d6f00"),
  },
  {
    type: "Breads",
    name: "Garlic Naan",
    description: "Tandoor naan brushed with garlic butter and coriander.",
    ingredients: ["flour", "garlic", "butter", "coriander"],
    special_ingredient: "Tandoor blister",
    weatherConditions: ["Clouds", "Rain", "Clear"],
    prices: [{ size: "R", price: 180, currency: "Rs" }],
    image: photo("1565299624946-b28f40a0ae38"),
  },
  {
    type: "Breads",
    name: "Roghni Naan",
    description: "Soft sesame naan, the usual partner for karahi and nihari.",
    ingredients: ["flour", "sesame", "milk", "ghee"],
    special_ingredient: "Nigella seed",
    weatherConditions: ["Clouds", "Rain"],
    prices: [{ size: "R", price: 160, currency: "Rs" }],
    image: photo("1551183053-bf2c1b1f3d0c"),
  },
  {
    type: "Desserts",
    name: "Gulab Jamun",
    description: "Warm milk-solid dumplings in cardamom syrup.",
    ingredients: ["khoya", "sugar syrup", "cardamom", "rose"],
    special_ingredient: "Saffron syrup",
    weatherConditions: ["Clouds", "Rain"],
    prices: [{ size: "R", price: 390, currency: "Rs" }],
    image: photo("1488477181946-6428a829bfd3"),
  },
  {
    type: "Desserts",
    name: "Kashmiri Kheer",
    description: "Slow rice pudding with almonds, pistachios and green cardamom.",
    ingredients: ["rice", "milk", "pistachio", "cardamom"],
    special_ingredient: "Condensed milk",
    weatherConditions: ["Clouds", "Rain", "Fog"],
    prices: [{ size: "R", price: 420, currency: "Rs" }],
    image: photo("1551024506-0bccd828d307"),
  },
  {
    type: "Desserts",
    name: "Molten Lava Cake",
    description: "Dark chocolate cake with a warm centre, vanilla ice cream on the side.",
    ingredients: ["dark chocolate", "butter", "egg", "vanilla ice cream"],
    special_ingredient: "Valrhona centre",
    weatherConditions: ["Clear", "Clouds"],
    prices: [{ size: "R", price: 650, currency: "Rs" }],
    image: photo("1578985545062-69928b1d9587"),
  },
  {
    type: "Hot Drinks",
    name: "Karak Chai",
    description: "Strong milk tea, boiled down the Pakistani way.",
    ingredients: ["tea", "milk", "cardamom", "sugar"],
    special_ingredient: "Loose leaf blend",
    weatherConditions: ["Rain", "Clouds", "Fog", "Thunderstorm"],
    prices: [
      { size: "S", price: 180, currency: "Rs" },
      { size: "M", price: 220, currency: "Rs" },
      { size: "L", price: 260, currency: "Rs" },
    ],
    image: photo("1571934811356-5cc061b6821f"),
  },
  {
    type: "Hot Drinks",
    name: "Kashmiri Pink Chai",
    description: "Salted pink tea with pistachios. Made for cold, grey afternoons.",
    ingredients: ["green tea", "milk", "bicarbonate", "pistachio"],
    special_ingredient: "Himalayan salt",
    weatherConditions: ["Rain", "Clouds", "Snow", "Fog"],
    prices: [
      { size: "S", price: 280, currency: "Rs" },
      { size: "M", price: 340, currency: "Rs" },
      { size: "L", price: 390, currency: "Rs" },
    ],
    image: photo("1511920170031-708a940cbb36"),
  },
  {
    type: "Hot Drinks",
    name: "Cappuccino",
    description: "Double espresso with steamed milk and a thick foam.",
    ingredients: ["espresso", "milk", "foam"],
    special_ingredient: "House espresso blend",
    weatherConditions: ["Clouds", "Rain", "Clear"],
    prices: [
      { size: "S", price: 390, currency: "Rs" },
      { size: "M", price: 450, currency: "Rs" },
      { size: "L", price: 510, currency: "Rs" },
    ],
    image: photo("1495474472287-4d71bcdd2085"),
  },
  {
    type: "Cold Drinks",
    name: "Mint Lemonade",
    description: "Fresh lemon, mint and soda over ice.",
    ingredients: ["lemon", "mint", "soda", "sugar"],
    special_ingredient: "Crushed ice",
    weatherConditions: ["Clear"],
    prices: [
      { size: "S", price: 280, currency: "Rs" },
      { size: "M", price: 340, currency: "Rs" },
      { size: "L", price: 390, currency: "Rs" },
    ],
    image: photo("1556679342-6b369514ac8e"),
  },
  {
    type: "Cold Drinks",
    name: "Mango Lassi",
    description: "Chaunsa mango blended with yoghurt. The summer cooler.",
    ingredients: ["mango", "yoghurt", "cardamom", "sugar"],
    special_ingredient: "Chaunsa pulp",
    weatherConditions: ["Clear"],
    prices: [
      { size: "S", price: 350, currency: "Rs" },
      { size: "M", price: 420, currency: "Rs" },
      { size: "L", price: 490, currency: "Rs" },
    ],
    image: photo("1623065427015-ff0c0592ceda"),
  },
  {
    type: "Cold Drinks",
    name: "Iced Latte",
    description: "Espresso over cold milk and ice.",
    ingredients: ["espresso", "milk", "ice"],
    special_ingredient: "Cold brew shot",
    weatherConditions: ["Clear"],
    prices: [
      { size: "S", price: 420, currency: "Rs" },
      { size: "M", price: 490, currency: "Rs" },
      { size: "L", price: 560, currency: "Rs" },
    ],
    image: photo("1461023058943-07fcbe16d735"),
  },
  {
    type: "Cold Drinks",
    name: "Fresh Lime Soda",
    description: "Sweet, salt or mixed — the classic Pakistani soda.",
    ingredients: ["lime", "soda", "salt", "sugar"],
    special_ingredient: "Black salt",
    weatherConditions: ["Clear"],
    prices: [
      { size: "S", price: 220, currency: "Rs" },
      { size: "M", price: 280, currency: "Rs" },
      { size: "L", price: 320, currency: "Rs" },
    ],
    image: photo("1513558165296-e25a8cb12422"),
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
  { rating: 5, text: "Best mango lassi I have had in Gulberg. Kids loved the lava cake too." },
  { rating: 4, text: "Malai boti was melt-in-mouth. Would like a spicier option on the grill menu." },
  { rating: 5, text: "Reserved online, got a confirmation on the app, and the table was ready. Smooth." },
  { rating: 2, text: "Order mix-up on delivery — we got handi instead of karahi. Replaced the next day though." },
  { rating: 5, text: "Daal mash tadka with roghni naan is now our weekly order." },
  { rating: 4, text: "Cappuccino was excellent. Parking on MM Alam is still a pain, not your fault." },
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
  { rating: 5, text: "Kashmiri chai on a grey afternoon. Reminded me of winters in Murree." },
  { rating: 2, text: "One naan was undercooked. Rest of the karahi order was fine." },
  { rating: 5, text: "Grilled fish was not dry — rare for Lahore restaurants. Well done." },
  { rating: 4, text: "Would love a kids portion of biryani. We currently split a small." },
  { rating: 5, text: "Staff remembered our usual table. That is why we do not go elsewhere." },
  { rating: 4, text: "Peak Friday dinner was loud but food came out in good time." },
  { rating: 5, text: "Pink chai and kheer after nihari. Closing the meal properly." },
  { rating: 3, text: "App showed a table as free that was already taken. Host sorted it quickly." },
  { rating: 5, text: "Pakora starter with corn soup during thunderstorm. Comfort food done right." },
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

const pickPrice = (rng, item) => {
  const option = pick(rng, item.prices);
  return { size: option.size, price: option.price, image: item.image.url, name: item.name };
};

const buildCart = (rng, items) => {
  const count = randInt(rng, 1, 4);
  const cart = [];
  for (let i = 0; i < count; i += 1) {
    const item = pick(rng, items);
    const line = pickPrice(rng, item);
    const quantity = item.type === "Breads" ? randInt(rng, 1, 4) : randInt(rng, 1, 2);
    cart.push({ name: line.name, image: line.image, price: line.price, size: line.size, quantity });
  }
  return cart;
};

const cartTotal = (cart) => cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

const dayVolume = (rng, date) => {
  const weekday = date.getDay();
  const weekend = weekday === 0 || weekday === 6;
  const friday = weekday === 5;
  const lunch = friday ? randInt(rng, 10, 14) : weekend ? randInt(rng, 11, 16) : randInt(rng, 7, 11);
  const afternoon = weekend ? randInt(rng, 3, 6) : randInt(rng, 1, 4);
  const dinner = friday ? randInt(rng, 16, 22) : weekend ? randInt(rng, 18, 26) : randInt(rng, 11, 17);
  const late = weekend ? randInt(rng, 3, 6) : randInt(rng, 1, 3);
  return { lunch, afternoon, dinner, late };
};

const hoursFor = (period) => {
  if (period === "lunch") return [12, 13, 14];
  if (period === "afternoon") return [15, 16, 17];
  if (period === "dinner") return [18, 19, 20, 21];
  return [22];
};

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
  const foodsWithType = foods.map((food, index) => ({ ...MENU[index], _id: food._id, image: food.image }));

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

  const pushOrder = ({ timestamp, periodItems, dineIn, statusOverride }) => {
    const customer = pick(rng, CUSTOMERS);
    const cart = buildCart(rng, periodItems);
    const total = cartTotal(cart);
    const status = statusOverride || statusFor(rng, timestamp, now);
    const orderType = dineIn ? "Dine In" : "Delivery";
    const payment = "Pay With Card";

    const doc = {
      email: customer.email,
      phone: customer.phone,
      cartItems: cart,
      orderType,
      status,
      total,
      payment,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (orderType === "Delivery") {
      doc.address = customer.address;
    } else {
      const freeTables = tables.filter((table) => !occupied.has(`${formatDate(timestamp)}|${formatTime(timestamp)}|${table.number}`));
      const table = pick(rng, freeTables.length ? freeTables : tables);
      const people = Math.max(1, Math.min(table.capacity, randInt(rng, 2, table.capacity)));
      occupied.add(`${formatDate(timestamp)}|${formatTime(timestamp)}|${table.number}`);
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
        status: status === "Pending" ? "Pending" : status === "Accepted" ? "Confirmed" : "Confirmed",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      doc.bookingid = String(bookingId);
    }

    orders.push(doc);
  };

  for (let dayOffset = DAYS; dayOffset >= 0; dayOffset -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset, 0, 0, 0, 0);
    const volume = dayVolume(rng, day);
    const periods = [
      ["lunch", volume.lunch],
      ["afternoon", volume.afternoon],
      ["dinner", volume.dinner],
      ["late", volume.late],
    ];

    for (const [period, count] of periods) {
      for (let i = 0; i < count; i += 1) {
        const hour = pick(rng, hoursFor(period));
        const minute = randInt(rng, 0, 59);
        const timestamp = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, randInt(rng, 0, 59));
        if (timestamp.getTime() - now.getTime() > 6 * 36e5) continue;

        const dineIn = rng() < 0.42;
        pushOrder({ timestamp, periodItems: foodsWithType, dineIn });
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
    const timestamp = new Date(now.getTime() - ticket.minutesAgo * 60 * 1000);
    pushOrder({
      timestamp,
      periodItems: foodsWithType,
      dineIn: ticket.dineIn,
      statusOverride: ticket.status,
    });
  }

  const extraBookingDays = 6;
  for (let i = 0; i < extraBookingDays; i += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 0, 0, 0, 0);
    const slots = [13, 14, 19, 20, 21];
    for (const hour of slots) {
      if (rng() > 0.55) continue;
      const customer = pick(rng, CUSTOMERS);
      const table = pick(rng, tables);
      const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0);
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
        status: i === 0 && hour <= now.getHours() ? "Confirmed" : roll < 0.15 ? "Cancelled" : roll < 0.45 ? "Pending" : "Confirmed",
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await Booking.collection.insertMany(bookings);
  await Order.collection.insertMany(orders);

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

  const orderStats = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const typeStats = await Order.aggregate([
    { $group: { _id: "$orderType", count: { $sum: 1 } } },
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

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
