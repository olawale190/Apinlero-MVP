import { ShopConfig } from '../types';

export const shopConfig: ShopConfig = {
  industry: 'wholesale',
  name: "Isha's Treat & Groceries",
  tagline: 'African & Caribbean Wholesale',
  currency: '₦',
  deliveryFee: 500,
  phone: '07448682282',
  location: 'Lagos, Nigeria'
};

export const platformConfig = {
  name: 'Àpínlẹ̀rọ',
  tagline: 'One Platform. Any Channel. Any Business.',
  poweredByText: 'Powered by Àpínlẹ̀rọ'
};

// Note: Categories are now managed dynamically from the database
// Use the CategoryFilter component which fetches from Supabase
// This array is kept for backward compatibility but should not be used
export const categories = [
  'All',
  'Fresh Meat & Poultry',
  'Fresh & Frozen Seafood',
  'Fresh Fruits & Vegetables',
  'Dairy & Eggs',
  'Grains, Rice & Pasta',
  'African & World Foods',
  'Flours',
  'Beans & Legumes',
  'Dried Fish',
  'Dried Vegetables',
  'Spices, Seasonings & Oils',
  'Canned, Packaged & Dry Foods',
  'Bakery & Breakfast Items',
  'Snacks & Treats',
  'Snacks & Confectionery',
  'Drinks & Beverages',
  'Household & Personal Care',
  'Household & Essentials',
  'Baby & Family Essentials',
  'Halal & Specialty Products'
];
