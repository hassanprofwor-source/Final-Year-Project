const unsplash = (id) => `https://images.unsplash.com/photo-${id}`;

export const FOOD_IMAGES = {
  "Chicken Pakora": unsplash("1596797038530-2c107229654b"),
  "Seekh Kebab Platter": unsplash("1599487488170-d11ec9c172f0"),
  "Dynamite Prawns": unsplash("1626082927389-6cd097cdc6ec"),
  "Chicken Corn Soup": unsplash("1547592166-23ac45744acd"),
  "Hot & Sour Soup": unsplash("1574484284002-952d92456975"),
  "Cream of Mushroom": unsplash("1414235077428-338989a2e8c0"),
  "Caesar Salad": unsplash("1540189549336-e6e99c3679fe"),
  Fattoush: unsplash("1546069901-ba9599a7e63c"),
  "Chicken Karahi": unsplash("1585937421612-70a008356fbe"),
  "Beef Nihari": unsplash("1546833999-b9f581a1996d"),
  "Butter Chicken": unsplash("1565557623262-b51c2513a641"),
  "Daal Mash Tadka": unsplash("1546833999-b9f581a1996d"),
  "Grilled Fish": unsplash("1519708227418-c8fd9a32b7a2"),
  "Chicken Handi": unsplash("1504674900247-0877df9cc836"),
  "Malai Boti": unsplash("1555939594-58d7cb561ad1"),
  "Mixed Grill Platter": unsplash("1555939594-58d7cb561ad1"),
  "Chicken Biryani": unsplash("1565557623262-b51c2513a641"),
  "Beef Biryani": unsplash("1504674900247-0877df9cc836"),
  "Garlic Naan": unsplash("1555507036-ab1f4038808a"),
  "Roghni Naan": unsplash("1555507036-ab1f4038808a"),
  "Gulab Jamun": unsplash("1551024506-0bccd828d307"),
  "Kashmiri Kheer": unsplash("1476224203421-9ac39bcb3327"),
  "Molten Lava Cake": unsplash("1578985545062-69928b1d9587"),
  "Karak Chai": unsplash("1571934811356-5cc061b6821f"),
  "Kashmiri Pink Chai": unsplash("1509042239860-f550ce710b93"),
  Cappuccino: unsplash("1495474472287-4d71bcdd2085"),
  "Mint Lemonade": unsplash("1527661591475-527312dd65f5"),
  "Mango Lassi": unsplash("1527661591475-527312dd65f5"),
  "Iced Latte": unsplash("1461023058943-07fcbe16d735"),
  "Fresh Lime Soda": unsplash("1567620905732-2d1ec7ab7445"),
};

export const foodPhoto = (name) => ({
  public_id: `seed/${name}`,
  url: FOOD_IMAGES[name],
});
