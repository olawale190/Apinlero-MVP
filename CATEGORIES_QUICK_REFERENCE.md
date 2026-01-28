# Categories & Sub-Categories Quick Reference

## Overview

Your Apinlero MVP now has a comprehensive **hierarchical category system** with 20+ main categories and support for unlimited sub-categories.

## Main Categories (32 total)

### 🥩 Fresh Products (Display Order: 1-4)
1. **Fresh Meat & Poultry** - Chicken, Beef, Goat, Turkey, Lamb
2. **Fresh & Frozen Seafood** - Fish, Prawns, Shrimps, Crabs, Lobster
3. **Fresh Fruits & Vegetables** - Spinach, Ugu, Tomatoes, Apples, Oranges
4. **Dairy & Eggs** - Milk, Cheese, Butter, Yogurt, Eggs

### 🌾 Grains & Staples (Display Order: 10-13)
5. **Grains, Rice & Pasta** - Rice varieties, Beans, Pasta, Noodles
6. **African & World Foods** - Yam, Plantain, Garri, Fufu, Poundo Yam
7. **Flours** - Yam Flour, Semolina, Wheat Meal, Oats
8. **Beans & Legumes** - Honey Beans, Black-Eyed Beans, Lentils

### 🐟 Dried & Preserved (Display Order: 20-21)
9. **Dried Fish** - Stockfish, Crayfish, Dried Catfish
10. **Dried Vegetables** - Bitter Leaf, Uziza Leaf, Ugu Leaf

### 🌶️ Cooking Essentials (Display Order: 30-31)
11. **Spices, Seasonings & Oils** - Palm Oil, Curry, Thyme, Suya Spice
12. **Canned, Packaged & Dry Foods** - Baked Beans, Sardines, Tomato Paste

### 🍞 Bakery & Snacks (Display Order: 40-42)
13. **Bakery & Breakfast Items** - Bread, Meat Pies, Cakes, Cereals
14. **Snacks & Treats** - Chin Chin, Plantain Chips, Puff-Puff
15. **Snacks & Confectionery** - Biscuits, Chocolates, Sweets

### 🥤 Beverages (Display Order: 50)
16. **Drinks & Beverages** - Water, Soft Drinks, Juice, Tea, Coffee

### 🧴 Household (Display Order: 60-61)
17. **Household & Personal Care** - Detergent, Soap, Toothpaste
18. **Household & Essentials** - Toilet Rolls, Tissues

### 👶 Family & Specialty (Display Order: 70-71)
19. **Baby & Family Essentials** - Baby Food, Diapers, Baby Wipes
20. **Halal & Specialty Products** - Halal Meat, Organic, Gluten-Free

### 🔄 Legacy Categories (Display Order: 80-90)
*For backward compatibility with existing products*
21-31. Oils & Fats, Grains & Rice, Meats, Seeds & Nuts, etc.

### 📦 Default (Display Order: 100)
32. **General** - Uncategorized items

---

## Sub-Categories

### Pre-configured Sub-Categories

**Fresh & Frozen Seafood > Prawns:**
- Tiger Prawns
- King Prawns
- Jumbo Prawns
- Freshwater Prawns
- White Prawns
- Brown Prawns

*Clients can add more sub-categories as needed*

### Suggested Sub-Categories to Add

**Grains, Rice & Pasta:**
- Long Grain Rice
- Basmati Rice
- Ofada Rice
- Brown Rice
- White Rice

**Fresh Meat & Poultry:**
- Whole Chicken
- Chicken Parts
- Beef Cuts
- Goat Meat
- Turkey
- Lamb

**Flours:**
- Yam Flour
- Cassava Flour
- Plantain Flour
- Wheat Flour
- Corn Flour

---

## How to Use

### Adding Products

```typescript
// With category only
{
  name: "Tomatoes",
  category: "Fresh Fruits & Vegetables",
  sub_category: null
}

// With category and sub-category
{
  name: "Jumbo Prawns 500g",
  category: "Fresh & Frozen Seafood",
  sub_category: "Jumbo Prawns"
}
```

### Managing Categories (Admin Dashboard)

1. Click "Manage Categories" button
2. Add/Edit/Delete main categories
3. Click folder tree icon to manage sub-categories
4. Add/Edit/Delete sub-categories for any category

### Database Queries

```sql
-- Get all categories
SELECT * FROM categories
WHERE store_id = 'ishas-treat' AND is_active = true
ORDER BY display_order;

-- Get sub-categories for a category
SELECT * FROM get_sub_categories('Fresh & Frozen Seafood');

-- Get products with full hierarchy
SELECT * FROM products_with_categories
WHERE category = 'Fresh & Frozen Seafood'
  AND sub_category = 'Tiger Prawns';

-- Count products per category
SELECT category, COUNT(*) as count
FROM products
WHERE is_active = true
GROUP BY category;
```

---

## Files Created/Modified

### New Files
- `project/supabase/migrations/20260128000000_update_categories.sql`
- `project/supabase/migrations/20260128000001_map_products_to_new_categories.sql`
- `project/supabase/migrations/20260128000002_add_subcategories.sql`
- `project/src/components/SubCategoryManager.tsx`
- `CATEGORIES_UPDATE_SUMMARY.md`
- `CATEGORIES_QUICK_REFERENCE.md`

### Modified Files
- `project/supabase/migrations/20260117000000_add_categories_table.sql`
- `project/src/types/index.ts` (added Category and SubCategory interfaces)
- `project/src/components/CategoryManager.tsx` (added sub-category management)

---

## Migration Order

Run these in order:

1. `20260117000000_add_categories_table.sql` - Base categories table
2. `20260128000000_update_categories.sql` - Update to comprehensive structure
3. `20260128000001_map_products_to_new_categories.sql` - Migrate existing products
4. `20260128000002_add_subcategories.sql` - Add sub-category support

---

## Key Features

✅ **32 comprehensive categories** covering all product types
✅ **Hierarchical organization** with sub-categories
✅ **Backward compatibility** with legacy categories
✅ **Easy management** through admin dashboard
✅ **Pre-configured Prawns sub-categories**
✅ **Flexible** - clients can add their own sub-categories
✅ **Scalable** - unlimited categories and sub-categories
✅ **Cultural relevance** - designed for African & Caribbean products

---

**Date**: January 28, 2026
**Status**: ✅ Complete and Ready to Deploy
