import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FolderOpen, Plus, Edit3, Trash2, X, Check, GripVertical, AlertTriangle } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  store_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  product_count?: number;
}

interface CategoryManagerProps {
  storeId?: string;
  onClose: () => void;
  onCategoriesChange: () => void;
}

export default function CategoryManager({ storeId = 'ishas-treat', onClose, onCategoriesChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New category state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Delete confirmation
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Fetch categories with product counts
  const fetchCategories = async () => {
    setLoading(true);

    // Fetch categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      setLoading(false);
      return;
    }

    // Fetch product counts per category
    const { data: productsData } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true);

    // Count products per category
    const productCounts: Record<string, number> = {};
    productsData?.forEach(p => {
      const cat = p.category || 'General';
      productCounts[cat] = (productCounts[cat] || 0) + 1;
    });

    // Merge counts into categories
    const categoriesWithCounts = categoriesData?.map(cat => ({
      ...cat,
      product_count: productCounts[cat.name] || 0
    })) || [];

    setCategories(categoriesWithCounts);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, [storeId]);

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    // Check if category already exists
    const exists = categories.some(
      c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (exists) {
      alert('A category with this name already exists');
      return;
    }

    setSaving(true);

    const maxOrder = Math.max(...categories.map(c => c.display_order), 0);

    const { error } = await supabase
      .from('categories')
      .insert([{
        name: newCategoryName.trim(),
        store_id: storeId,
        display_order: maxOrder + 1,
        is_active: true
      }]);

    if (!error) {
      setNewCategoryName('');
      setShowAddForm(false);
      await fetchCategories();
      onCategoriesChange();
    } else {
      alert('Error adding category: ' + error.message);
    }

    setSaving(false);
  };

  // Edit category name
  const handleEditCategory = async (categoryId: string) => {
    if (!editName.trim()) return;

    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    // Check if new name already exists (excluding current)
    const exists = categories.some(
      c => c.id !== categoryId && c.name.toLowerCase() === editName.trim().toLowerCase()
    );
    if (exists) {
      alert('A category with this name already exists');
      return;
    }

    setSaving(true);

    // Update category name
    const { error: categoryError } = await supabase
      .from('categories')
      .update({ name: editName.trim() })
      .eq('id', categoryId);

    if (categoryError) {
      alert('Error updating category: ' + categoryError.message);
      setSaving(false);
      return;
    }

    // Update all products with the old category name to the new name
    const { error: productsError } = await supabase
      .from('products')
      .update({ category: editName.trim() })
      .eq('category', category.name);

    if (productsError) {
      console.error('Error updating products:', productsError);
    }

    setEditingId(null);
    setEditName('');
    await fetchCategories();
    onCategoriesChange();
    setSaving(false);
  };

  // Delete category (soft delete)
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    setSaving(true);

    // Soft delete the category
    const { error: categoryError } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', deletingCategory.id);

    if (categoryError) {
      alert('Error deleting category: ' + categoryError.message);
      setSaving(false);
      return;
    }

    // Move products from deleted category to "General"
    if (deletingCategory.product_count && deletingCategory.product_count > 0) {
      const { error: productsError } = await supabase
        .from('products')
        .update({ category: 'General' })
        .eq('category', deletingCategory.name);

      if (productsError) {
        console.error('Error moving products:', productsError);
      }
    }

    setDeletingCategory(null);
    await fetchCategories();
    onCategoriesChange();
    setSaving(false);
  };

  // Start editing
  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: '#1e3a5f' }}>
            <FolderOpen size={20} />
            Manage Categories
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  <GripVertical size={16} className="text-gray-300" />

                  {editingId === category.id ? (
                    // Edit mode
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditCategory(category.id);
                          if (e.key === 'Escape') cancelEditing();
                        }}
                      />
                      <button
                        onClick={() => handleEditCategory(category.id)}
                        disabled={saving}
                        className="p-1.5 bg-green-100 hover:bg-green-200 rounded transition"
                      >
                        <Check size={16} className="text-green-600" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded transition"
                      >
                        <X size={16} className="text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{category.name}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({category.product_count || 0} products)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(category)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded transition"
                          title="Rename"
                        >
                          <Edit3 size={14} className="text-blue-600" />
                        </button>
                        {category.name !== 'General' && (
                          <button
                            onClick={() => setDeletingCategory(category)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add New Category Form */}
              {showAddForm ? (
                <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg border-2 border-dashed border-teal-200">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                      if (e.key === 'Escape') {
                        setShowAddForm(false);
                        setNewCategoryName('');
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={saving || !newCategoryName.trim()}
                    className="p-1.5 bg-green-100 hover:bg-green-200 rounded transition disabled:opacity-50"
                  >
                    <Check size={16} className="text-green-600" />
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCategoryName('');
                    }}
                    className="p-1.5 bg-gray-200 hover:bg-gray-300 rounded transition"
                  >
                    <X size={16} className="text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal-500 hover:text-teal-600 transition"
                >
                  <Plus size={18} />
                  Add New Category
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                <AlertTriangle size={20} />
                Delete Category
              </h3>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this category?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-semibold text-gray-800">{deletingCategory.name}</p>
                <p className="text-sm text-gray-500">
                  {deletingCategory.product_count || 0} products
                </p>
              </div>
              {(deletingCategory.product_count || 0) > 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertTriangle className="inline-block mr-1 mb-0.5" size={14} />
                  Products in this category will be moved to "General".
                </p>
              )}
            </div>

            <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={handleDeleteCategory}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete Category'}
              </button>
              <button
                onClick={() => setDeletingCategory(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
