import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  storeId?: string;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
}

const DEFAULT_CATEGORIES = [
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
  'Snacks & Confectionery',
  'Drinks & Beverages',
  'Household & Essentials',
  'Baby & Family Essentials',
  'Halal & Specialty Products',
  'General'
];

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  storeId = 'ishas-treat'
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, [storeId]);

  const fetchCategories = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, display_order')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
      return;
    }

    // Auto-seed missing categories if the table has fewer than expected
    const existingNames = new Set((data || []).map(c => c.name));
    const missing = DEFAULT_CATEGORIES.filter(name => !existingNames.has(name));

    if (missing.length > 0) {
      console.log(`🔧 Seeding ${missing.length} missing categories...`);
      const maxOrder = Math.max(...(data || []).map(c => c.display_order), 0);
      const toInsert = missing.map((name, i) => ({
        name,
        store_id: storeId,
        display_order: maxOrder + i + 1,
        is_active: true
      }));

      const { error: insertError } = await supabase
        .from('categories')
        .insert(toInsert);

      if (!insertError) {
        // Re-fetch to get the full list with IDs
        const { data: refreshed } = await supabase
          .from('categories')
          .select('id, name, display_order')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        setCategories(refreshed || []);
        setLoading(false);
        return;
      } else {
        console.warn('⚠️ Failed to seed categories:', insertError.message);
      }
    }

    setCategories(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-white border-b sticky top-[88px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <div className="animate-pulse flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-24 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b sticky top-[88px] z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* "All" category button */}
          <button
            onClick={() => onCategoryChange('All')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>

          {/* Database categories */}
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.name
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
