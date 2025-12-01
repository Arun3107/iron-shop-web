// app/admin/constants.ts

export const WORKERS = ["Anil", "Sikandar"];
export const DISCOUNT_OPTIONS = [0, 5, 10, 20];

export const ITEM_PRICES = {
  // Men clothing
  men_shirt_kurta_tshirt: {
    label: "Shirt / Kurta / T-Shirt",
    price: 10,
  },
  men_trouser_jeans_shorts_pyjama: {
    label: "Trouser / Jeans / Shorts / Pyjama",
    price: 10,
  },
  men_coat_blazer_jacket: {
    label: "Coat / Blazer / Jacket",
    price: 50,
  },
  men_dhoti_lungi: {
    label: "Dhoti / Lungi",
    price: 30,
  },

  // Women Clothing
  women_kurti_top: {
    label: "Kurti / Top",
    price: 10,
  },
  women_leggings_pant_salwar_shorts: {
    label: "Leggings / Pant / Salwar / Shorts",
    price: 10,
  },
  women_dress: {
    label: "Dress",
    price: 35,
  },
  women_simple_saree: {
    label: "Simple Saree",
    price: 45,
  },
  women_heavy_silk_saree: {
    label: "Heavy / Silk Saree",
    price: 60,
  },
  women_lehenga: {
    label: "Lehenga",
    price: 60,
  },

  // Kids
  kids_below5: {
    label: "Kids wear (below 5 years)",
    price: 8,
  },

  // Home items
  home_pillow_small_towel: {
    label: "Pillow Cover / Small Towel",
    price: 5,
  },
  home_curtain_bedsheet_single: {
    label: "Curtain / Bedsheet (Single)",
    price: 30,
  },
  home_curtain_bedsheet_double: {
    label: "Curtain / Bedsheet (Double)",
    price: 45,
  },
} as const;

