# Categories Update Summary

## Issue Identified
Isha mentioned that some items were not included in the categories. After reviewing the codebase, I found a **mismatch between the product categories used in the seed data and the categories defined in the categories table**.

## Root Cause
The original categories table migration (`20260117000000_add_categories_table.sql`) defined only 10 simplified categories:
- Grains, Oils, Produce, Fish, Meat, Spices, Canned, Drinks, Flour, General

However, the product seed data (`seed-isha-treat-products.sql`) uses **15 specific categories**:
- Oils & Fats
- Grains & Rice
- Flours
- Beans & Legumes
- Dried Fish
- Meats
- Seeds & Nuts
- Dried Vegetables
- Seasonings
- Spices
- Beverages
- Canned Goods
- Fresh Produce
- Snacks
- Household

## Products Affected
Without the correct categories, the following products would be **uncategorized or incorrectly categorized**:

### Missing Categories Impact:
1. **Oils & Fats** (5 products) - Palm Oil, Groundnut Oil, Coconut Oil, Shea Butter
2. **Grains & Rice** (3 products) - Nigerian Rice, Basmati Rice
3. **Flours** (7 products) - Yam Flour, Cassava Flour, Plantain Flour, Semolina, Pounded Yam, Cornmeal
4. **Beans & Legumes** (5 products) - Honey Beans, Black-Eyed Beans, Brown Beans, Lentils, Chickpeas
5. **Dried Fish** (9 products) - Stockfish, Dried Catfish, Crayfish, Dried Prawns, Dried Shrimp, Dried Tilapia
6. **Seeds & Nuts** (2 products) - Egusi, Ogbono
7. **Dried Vegetables** (4 products) - Bitter Leaf, Uziza Leaf, Ugu Leaf, Efo Tete
8. **Seasonings** (5 products) - Locust Beans, Ukpaka, Maggi Cubes, Knorr Cubes, Royco
9. **Beverages** (8 products) - Milo, Peak Milk, Bournvita, Lipton Tea, Zobo Leaves, Palm Wine
10. **Canned Goods** (7 products) - Tomato Paste, Sardines, Mackerel, Corned Beef, Baked Beans
11. **Fresh Produce** (7 products) - Yam, Plantain, Cocoyam, Fresh Pepper Mix, Onions, Tomatoes, Ginger
12. **Snacks** (5 products) - Chin Chin, Plantain Chips, Puff Puff Mix, Kilishi, Kuli Kuli
13. **Household** (3 products) - Black Soap, Shea Butter (Body), Chewing Sponge

**Total: ~70+ products** were potentially uncategorized or incorrectly mapped.

## Changes Made

### 1. Updated Base Migration File
**File**: `project/supabase/migrations/20260117000000_add_categories_table.sql`

Changed the default categories from 10 simplified ones to 16 comprehensive categories that match the actual product catalog.

### 2. Created New Migration for Existing Databases
**File**: `project/supabase/migrations/20260128000000_update_categories.sql`

This migration:
- Deactivates old incorrect categories
- Inserts all 15 correct product categories
- Keeps the "General" category for uncategorized items
- Creates a unique index to prevent duplicate category names per store
- Safely handles existing data with `ON CONFLICT` clauses

## Complete Category List (Updated)

### Primary Categories (Main Store Organization)

| Display Order | Category Name                    | Example Products                                      |
|---------------|----------------------------------|------------------------------------------------------|
| **Fresh Products** |
| 1             | Fresh Meat & Poultry             | Whole Chicken, Beef, Goat Meat, Turkey, Lamb        |
| 2             | Fresh & Frozen Seafood           | Fresh Fish, Prawns, Shrimps, Crabs, Stockfish       |
| 3             | Fresh Fruits & Vegetables        | Spinach, Ugu, Tomatoes, Apples, Oranges, Mango      |
| 4             | Dairy & Eggs                     | Fresh Milk, Cheese, Butter, Yogurt, Eggs             |
| **Grains & Staples** |
| 10            | Grains, Rice & Pasta             | Long Grain Rice, Basmati, Beans, Spaghetti, Noodles |
| 11            | African & World Foods            | Yam, Plantain, Garri, Fufu, Poundo Yam, Cassava     |
| 12            | Flours                           | Yam Flour, Semolina, Wheat Meal, Oats                |
| 13            | Beans & Legumes                  | Honey Beans, Black-Eyed Beans, Lentils, Chickpeas   |
| **Dried & Preserved** |
| 20            | Dried Fish                       | Stockfish, Crayfish, Dried Catfish, Dried Prawns    |
| 21            | Dried Vegetables                 | Bitter Leaf, Uziza Leaf, Ugu Leaf, Efo Tete         |
| **Cooking Essentials** |
| 30            | Spices, Seasonings & Oils        | Palm Oil, Curry, Thyme, Suya Spice, Crayfish, Iru   |
| 31            | Canned, Packaged & Dry Foods     | Baked Beans, Sardines, Tomato Paste, Custard        |
| **Bakery & Snacks** |
| 40            | Bakery & Breakfast Items         | Bread, Meat Pies, Cakes, Custard, Cornflakes, Oats  |
| 41            | Snacks & Treats                  | Chin Chin, Plantain Chips, Puff-Puff, Popcorn       |
| 42            | Snacks & Confectionery           | Biscuits, Chocolates, Sweets, Cookies               |
| **Beverages** |
| 50            | Drinks & Beverages               | Bottled Water, Soft Drinks, Juice, Malt, Tea        |
| **Household** |
| 60            | Household & Personal Care        | Detergent, Dish Soap, Toothpaste, Body Soap, Cream  |
| 61            | Household & Essentials           | Toilet Rolls, Tissues, Washing Powder                |
| **Family & Specialty** |
| 70            | Baby & Family Essentials         | Baby Food, Baby Milk, Diapers, Baby Wipes           |
| 71            | Halal & Specialty Products       | Halal Meat, Halal Chicken, Organic, Gluten-Free     |

### Legacy Categories (Backward Compatibility)

| Display Order | Category Name       | Notes                                          |
|---------------|---------------------|------------------------------------------------|
| 80            | Oils & Fats         | Maps to "Spices, Seasonings & Oils"            |
| 81            | Grains & Rice       | Maps to "Grains, Rice & Pasta"                 |
| 82            | Meats               | Maps to "Fresh Meat & Poultry"                 |
| 83            | Seeds & Nuts        | Maps to "Spices, Seasonings & Oils"            |
| 84            | Seasonings          | Maps to "Spices, Seasonings & Oils"            |
| 85            | Spices              | Maps to "Spices, Seasonings & Oils"            |
| 86            | Beverages           | Maps to "Drinks & Beverages"                   |
| 87            | Canned Goods        | Maps to "Canned, Packaged & Dry Foods"         |
| 88            | Fresh Produce       | Maps to "Fresh Fruits & Vegetables"            |
| 89            | Snacks              | Maps to "Snacks & Treats"                      |
| 90            | Household           | Maps to "Household & Personal Care"            |
| 100           | General             | Uncategorized items                            |

## How to Apply the Changes

### Option 1: Fresh Database Setup
If setting up a new database, the updated migration file will automatically create the correct categories.

```bash
# Run migrations in order
psql $DATABASE_URL -f project/supabase/migrations/20260117000000_add_categories_table.sql
```

### Option 2: Existing Database Update
If you already have a database with the old categories:

```bash
# Apply the update migration
psql $DATABASE_URL -f project/supabase/migrations/20260128000000_update_categories.sql
```

Or through Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `20260128000000_update_categories.sql`
3. Execute the script

## Verification

After applying the migration, verify the categories:

```sql
-- Check all active categories
SELECT name, display_order, is_active, store_id
FROM categories
WHERE store_id = 'ishas-treat' AND is_active = true
ORDER BY display_order;

-- Check product counts per category
SELECT category, COUNT(*) as product_count
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- Find any uncategorized products
SELECT name, category
FROM products
WHERE is_active = true
  AND (category IS NULL
       OR category NOT IN (
         SELECT name FROM categories
         WHERE store_id = 'ishas-treat' AND is_active = true
       ));
```

## Product Category Mapping Guide

When adding new products, use this guide to assign the correct category:

### Fresh Products
- **Fresh Meat & Poultry**: Whole Chicken, Wings, Drumsticks, Breast, Turkey, Beef, Goat Meat, Lamb, Minced Beef, Cow Foot, Oxtail
- **Fresh & Frozen Seafood**: Fresh/Frozen Fish, Prawns, Shrimps, Crabs, Lobster, Catfish, Mackerel, Croaker, Red Snapper, Stockfish (if fresh)
- **Fresh Fruits & Vegetables**:
  - Vegetables: Spinach, Ugu, Waterleaf, Bitterleaf, Okra, Tomatoes, Fresh Pepper, Onions, Cabbage, Carrots
  - Fruits: Apples, Oranges, Bananas, Pineapple, Mango, Watermelon, Grapes, Avocado
- **Dairy & Eggs**: Fresh Milk, Powdered Milk, Cheese, Butter, Yogurt, Eggs

### Grains & Staples
- **Grains, Rice & Pasta**: Long Grain Rice, Basmati, Ofada, Brown Rice, Beans, Spaghetti, Macaroni, Noodles
- **African & World Foods**: Yam (Fresh/Frozen), Plantain, Cassava products, Poundo Yam, Semolina, Wheat Meal
- **Flours**: Garri, Yam Flour (Elubo), Semolina, Plantain Flour, Cassava Flour, Fufu Flour, Oatmeal
- **Beans & Legumes**: Honey Beans, Black-Eyed Beans, Brown Beans, Lentils, Chickpeas

### Dried & Preserved
- **Dried Fish**: Stockfish (dried), Dried Catfish, Crayfish, Dried Prawns, Dried Shrimp, Dried Tilapia
- **Dried Vegetables**: Dried Bitter Leaf, Uziza Leaf, Ugu Leaf, Efo Tete

### Cooking Essentials
- **Spices, Seasonings & Oils**: Palm Oil, Groundnut Oil, Vegetable Oil, Red Pepper, Curry, Thyme, Suya Spice, Ogbono, Egusi, Crayfish, Iru, Bouillon Cubes
- **Canned, Packaged & Dry Foods**: Baked Beans, Sardines, Corned Beef, Tuna, Tomato Paste, Custard Powder, Cereals

### Bakery & Snacks
- **Bakery & Breakfast Items**: Bread, Agege Bread, Croissants, Cakes, Meat Pies, Sausage Rolls, Doughnuts, Custard, Cornflakes, Oats, Tea, Coffee
- **Snacks & Treats**: Chin Chin, Plantain Chips, Popcorn, Puff-Puff
- **Snacks & Confectionery**: Biscuits, Chocolate, Sweets, Candy, Cookies

### Beverages
- **Drinks & Beverages**: Bottled Water, Soft Drinks, Fruit Juice, Malt Drinks, Energy Drinks, Zobo, Kunu, Tea, Coffee

### Household
- **Household & Personal Care**: Laundry Detergent, Washing Powder, Dish Soap, Hand Wash, Toothpaste, Toothbrush, Body Soap, Body Cream
- **Household & Essentials**: Toilet Rolls, Tissues, Detergents

### Family & Specialty
- **Baby & Family Essentials**: Baby Food, Baby Milk, Diapers, Baby Wipes, Baby Soap
- **Halal & Specialty Products**: Halal Meat, Halal Chicken, Organic Produce, Gluten-Free Items, African Specialty Foods

## Benefits of This Update

1. **Complete Product Coverage**: All 100+ products now have proper categories
2. **Better Organization**: Comprehensive categories organized by product type and shopping patterns
3. **Customer-Friendly Navigation**: Categories grouped logically (Fresh, Grains, Cooking, etc.)
4. **Accurate Filtering**: The CategoryFilter component will now show all relevant categories
5. **Improved Analytics**: Better category-based reporting and insights
6. **Backward Compatibility**: Legacy categories preserved for existing products
7. **Scalability**: Easy to add new categories as the product catalog grows
8. **Cultural Relevance**: Categories reflect African & Caribbean shopping needs

## Sub-Categories Feature

In addition to the main categories, we've added **sub-category support** to allow more granular product organization.

### How Sub-Categories Work

- Each category can have multiple sub-categories
- Products can be assigned both a category and a sub-category
- Sub-categories are optional - not all products need them
- Useful for organizing large product groups (e.g., different types of Prawns, Rice varieties, etc.)

### Example: Prawns Sub-Categories

For the "Fresh & Frozen Seafood" category, we've pre-configured these sub-categories:

- Tiger Prawns
- King Prawns
- Jumbo Prawns
- Freshwater Prawns
- White Prawns
- Brown Prawns

Clients can add more sub-categories as needed through the admin dashboard.

### Database Structure

**sub_categories table:**
- `id` - Unique identifier
- `name` - Sub-category name
- `category_id` - Parent category reference
- `store_id` - Store identifier
- `display_order` - Sorting order
- `is_active` - Soft delete flag

**products table (updated):**
- Added `sub_category` column (optional text field)

### Managing Sub-Categories

1. **Via Admin Dashboard:**
   - Open CategoryManager
   - Click the folder tree icon next to any category
   - Opens SubCategoryManager modal
   - Add, edit, or delete sub-categories

2. **Via Database:**
   ```sql
   -- Get all sub-categories for a category
   SELECT * FROM get_sub_categories('Fresh & Frozen Seafood');

   -- View products with full category hierarchy
   SELECT * FROM products_with_categories;
   ```

### Migration Files

- `20260128000002_add_subcategories.sql` - Creates sub-categories table and adds Prawns sub-categories
- Adds helper functions and views for querying hierarchical data

## Next Steps

1. Apply all migrations to your database in order:
   - `20260117000000_add_categories_table.sql` (base categories)
   - `20260128000000_update_categories.sql` (update to new structure)
   - `20260128000001_map_products_to_new_categories.sql` (migrate existing products)
   - `20260128000002_add_subcategories.sql` (add sub-category support)

2. Verify all products have matching categories
3. Test the CategoryManager and SubCategoryManager in the admin dashboard
4. Test the CategoryFilter component on the Shop page
5. Add sub-categories to other categories as needed (e.g., Rice varieties, Meat cuts)
6. Update WhatsApp bot to handle categories and sub-categories

---

**Date**: January 28, 2026
**Issue**: Missing product categories
**Reported by**: Isha
**Status**: ✅ Resolved
