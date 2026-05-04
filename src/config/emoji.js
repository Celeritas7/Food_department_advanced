/**
 * emoji.js — Central emoji maps for the entire app
 */

export const CATEGORY_EMOJI = {
  'Aromatics': '🌿',
  'Basic': '🧂',
  'Cake ingredient': '🧁',
  'Canned/Pantry': '🥫',
  'Carbs': '🍚',
  'Condiments': '🫙',
  'Daily need': '🧴',
  'Dairy': '🥛',
  'Drinks': '🥤',
  'Egg': '🥚',
  'Flour': '🌾',
  'Frozen': '🧊',
  'Fruits': '🍎',
  'Grains': '🌾',
  'Herbs': '🌿',
  'Meat': '🥩',
  'Mushroom': '🍄',
  'Noodles': '🍜',
  'Nuts': '🥜',
  'Oil': '🫒',
  'Oils': '🫒',
  'Sauces': '🥫',
  'Seafood': '🐟',
  'Spices': '🌶️',
  'Tofu': '🫘',
  'Vegetables': '🥬',
};

export const DISH_TYPE_EMOJI = {
  'Cake': '🎂',
  'Curry': '🍛',
  'Dessert': '🍮',
  'Grilled': '🔥',
  'Noodle': '🍜',
  'Rice': '🍚',
  'Salad': '🥗',
  'Snack': '🍡',
  'Soup': '🍲',
  'Stir-fry': '🥘',
};

export const COUNTRY_FLAG = {
  'American': '🇺🇸',
  'Burmese': '🇲🇲',
  'Chinese': '🇨🇳',
  'Indian': '🇮🇳',
  'Italian': '🇮🇹',
  'Japanese': '🇯🇵',
  'Korean': '🇰🇷',
  'Mexican': '🇲🇽',
  'Myanmar': '🇲🇲',
  'Thai': '🇹🇭',
};

export const getCatEmoji = (cat) => CATEGORY_EMOJI[cat] || '📦';
export const getDishTypeEmoji = (type) => DISH_TYPE_EMOJI[type] || '🍽️';
export const getCountryFlag = (country) => COUNTRY_FLAG[country] || '🌍';

/** All known categories for dropdowns */
export const ALL_CATEGORIES = Object.keys(CATEGORY_EMOJI).sort();
