import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FolderTree, Plus, Edit3, Trash2, X, Check, GripVertical, AlertTriangle } from 'lucide-react';
import { Category, SubCategory } from '../types';

interface SubCategoryManagerProps {
  category: Category;
  storeId?: string;
  onClose: () => void;
  onSubCategoriesChange: () => void;
}

export default function SubCategoryManager({
  category,
  storeId = 'ishas-treat',
  onClose,
  onSubCategoriesChange
}: SubCategoryManagerProps) {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New sub-category state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Delete confirmation
  const [deletingSubCategory, setDeletingSubCategory] = useState<SubCategory | null>(null);

  // Fetch sub-categories with product counts
  const fetchSubCategories = async () => {
    setLoading(true);

    // Fetch sub-categories for this category
    const { data: subCategoriesData, error: subCategoriesError } = await supabase
      .from('sub_categories')
      .select('*')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (subCategoriesError) {
      console.error('Error fetching sub-categories:', subCategoriesError);
      setLoading(false);
      return;
    }

    // Fetch product counts per sub-category
    const { data: productsData } = await supabase
      .from('products')
      .select('sub_category')
      .eq('category', category.name)
      .eq('is_active', true);

    // Count products per sub-category
    const productCounts: Record<string, number> = {};
    productsData?.forEach(p => {
      const subCat = p.sub_category;
      if (subCat) {
        productCounts[subCat] = (productCounts[subCat] || 0) + 1;
      }
    });

    // Merge counts into sub-categories
    const subCategoriesWithCounts = subCategoriesData?.map(subCat => ({
      ...subCat,
      product_count: productCounts[subCat.name] || 0
    })) || [];

    setSubCategories(subCategoriesWithCounts);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubCategories();
  }, [category.id]);

  // Add new sub-category
  const handleAddSubCategory = async () => {
    if (!newSubCategoryName.trim()) return;

    // Check if sub-category already exists
    const exists = subCategories.some(
      sc => sc.name.toLowerCase() === newSubCategoryName.trim().toLowerCase()
    );
    if (exists) {
      alert('A sub-category with this name already exists');
      return;
    }

    setSaving(true);

    const maxOrder = Math.max(...subCategories.map(sc => sc.display_order), 0);

    const { error } = await supabase
      .from('sub_categories')
      .insert([{
        name: newSubCategoryName.trim(),
        category_id: category.id,
        store_id: storeId,
        display_order: maxOrder + 1,
        is_active: true
      }]);

    if (!error) {
      setNewSubCategoryName('');
      setShowAddForm(false);
      await fetchSubCategories();
      onSubCategoriesChange();
    } else {
      alert('Error adding sub-category: ' + error.message);
    }

    setSaving(false);
  };

  // Edit sub-category name
  const handleEditSubCategory = async (subCategoryId: string) => {
    if (!editName.trim()) return;

    const subCategory = subCategories.find(sc => sc.id === subCategoryId);
    if (!subCategory) return;

    // Check if new name already exists (excluding current)
    const exists = subCategories.some(
      sc => sc.id !== subCategoryId && sc.name.toLowerCase() === editName.trim().toLowerCase()
    );
    if (exists) {
      alert('A sub-category with this name already exists');
      return;
    }

    setSaving(true);

    // Update sub-category name
    const { error: subCategoryError } = await supabase
      .from('sub_categories')
      .update({ name: editName.trim() })
      .eq('id', subCategoryId);

    if (subCategoryError) {
      alert('Error updating sub-category: ' + subCategoryError.message);
      setSaving(false);
      return;
    }

    // Update all products with the old sub-category name to the new name
    const { error: productsError } = await supabase
      .from('products')
      .update({ sub_category: editName.trim() })
      .eq('category', category.name)
      .eq('sub_category', subCategory.name);

    if (productsError) {
      console.error('Error updating products:', productsError);
    }

    setEditingId(null);
    setEditName('');
    await fetchSubCategories();
    onSubCategoriesChange();
    setSaving(false);
  };

  // Delete sub-category (soft delete)
  const handleDeleteSubCategory = async () => {
    if (!deletingSubCategory) return;

    setSaving(true);

    // Soft delete the sub-category
    const { error: subCategoryError } = await supabase
      .from('sub_categories')
      .update({ is_active: false })
      .eq('id', deletingSubCategory.id);

    if (subCategoryError) {
      alert('Error deleting sub-category: ' + subCategoryError.message);
      setSaving(false);
      return;
    }

    // Clear sub_category from products
    if (deletingSubCategory.product_count && deletingSubCategory.product_count > 0) {
      const { error: productsError } = await supabase
        .from('products')
        .update({ sub_category: null })
        .eq('category', category.name)
        .eq('sub_category', deletingSubCategory.name);

      if (productsError) {
        console.error('Error clearing sub-category from products:', productsError);
      }
    }

    setDeletingSubCategory(null);
    await fetchSubCategories();
    onSubCategoriesChange();
    setSaving(false);
  };

  // Start editing
  const startEditing = (subCategory: SubCategory) => {
    setEditingId(subCategory.id);
    setEditName(subCategory.name);
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
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: '#1e3a5f' }}>
                <FolderTree size={20} />
                Manage Sub-Categories
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Category: <span className="font-medium">{category.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {subCategories.length === 0 && !showAddForm ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderTree size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No sub-categories yet</p>
                  <p className="text-xs mt-1">Add sub-categories to organize products better</p>
                </div>
              ) : (
                subCategories.map(subCategory => (
                  <div
                    key={subCategory.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                  >
                    <GripVertical size={16} className="text-gray-300" />

                    {editingId === subCategory.id ? (
                      // Edit mode
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSubCategory(subCategory.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                        <button
                          onClick={() => handleEditSubCategory(subCategory.id)}
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
                          <span className="font-medium text-gray-800">{subCategory.name}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({subCategory.product_count || 0} products)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(subCategory)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded transition"
                            title="Rename"
                          >
                            <Edit3 size={14} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => setDeletingSubCategory(subCategory)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}

              {/* Add New Sub-Category Form */}
              {showAddForm ? (
                <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg border-2 border-dashed border-teal-200">
                  <input
                    type="text"
                    value={newSubCategoryName}
                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                    placeholder="New sub-category name"
                    className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubCategory();
                      if (e.key === 'Escape') {
                        setShowAddForm(false);
                        setNewSubCategoryName('');
                      }
                    }}
                  />
                  <button
                    onClick={handleAddSubCategory}
                    disabled={saving || !newSubCategoryName.trim()}
                    className="p-1.5 bg-green-100 hover:bg-green-200 rounded transition disabled:opacity-50"
                  >
                    <Check size={16} className="text-green-600" />
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewSubCategoryName('');
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
                  Add New Sub-Category
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
      {deletingSubCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg text-red-600 flex items-center gap-2">
                <AlertTriangle size={20} />
                Delete Sub-Category
              </h3>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this sub-category?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-semibold text-gray-800">{deletingSubCategory.name}</p>
                <p className="text-sm text-gray-500">
                  {deletingSubCategory.product_count || 0} products
                </p>
              </div>
              {(deletingSubCategory.product_count || 0) > 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertTriangle className="inline-block mr-1 mb-0.5" size={14} />
                  Products will remain in "{category.name}" but sub-category will be cleared.
                </p>
              )}
            </div>

            <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={handleDeleteSubCategory}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete Sub-Category'}
              </button>
              <button
                onClick={() => setDeletingSubCategory(null)}
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
