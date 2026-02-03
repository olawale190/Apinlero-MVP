// Addresses Page
// Customer saved addresses management

import { useState } from 'react';
import { ArrowLeft, MapPin, Plus, Edit2, Trash2, Check, Loader2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAddresses, CustomerAddress } from '../../hooks/useAddresses';
import { colors } from '../../config/colors';

type AddressFormData = Omit<CustomerAddress, 'id' | 'customer_id' | 'business_id' | 'created_at' | 'updated_at'>;

const emptyForm: AddressFormData = {
  label: 'Home',
  full_name: '',
  phone: null,
  address_line1: '',
  address_line2: null,
  city: '',
  postcode: '',
  country: 'UK',
  is_default: false
};

export default function AddressesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addresses, isLoading, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddresses();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    window.location.href = '/';
    return null;
  }

  const handleEdit = (address: CustomerAddress) => {
    setFormData({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      postcode: address.postcode,
      country: address.country,
      is_default: address.is_default
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      if (editingId) {
        const success = await updateAddress(editingId, formData);
        if (!success) {
          setError('Failed to update address');
          return;
        }
      } else {
        const id = await addAddress(formData);
        if (!id) {
          setError('Failed to add address');
          return;
        }
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    await deleteAddress(id);
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setError('');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back to shop"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Saved Addresses</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Navigation */}
        <nav className="flex flex-wrap gap-2 mb-6">
          <a href="/account" className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">
            Profile
          </a>
          <a href="/account/orders" className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">
            Orders
          </a>
          <a href="/account/addresses" className={`px-4 py-2 rounded-lg text-sm font-medium ${colors.tailwind.primaryMain} text-white`}>
            Addresses
          </a>
          <a href="/account/wishlist" className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">
            Wishlist
          </a>
        </nav>

        {/* Add Address Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className={`w-full mb-6 py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 font-medium flex items-center justify-center gap-2 hover:border-teal-500 hover:text-teal-600 transition-colors`}
          >
            <Plus size={20} />
            Add New Address
          </button>
        )}

        {/* Address Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button onClick={cancelForm} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
                <div className="flex gap-2">
                  {(['Home', 'Work', 'Other'] as const).map(label => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFormData({ ...formData, label })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.label === label
                          ? `${colors.tailwind.primaryMain} text-white`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={e => setFormData({ ...formData, phone: e.target.value || null })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Street address"
                  required
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (optional)</label>
                <input
                  type="text"
                  value={formData.address_line2 || ''}
                  onChange={e => setFormData({ ...formData, address_line2: e.target.value || null })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Flat, suite, unit, etc."
                />
              </div>

              {/* City and Postcode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                  <input
                    type="text"
                    value={formData.postcode}
                    onChange={e => setFormData({ ...formData, postcode: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Default Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Set as default address</span>
              </label>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 py-3 rounded-lg text-white font-medium ${colors.tailwind.primaryMain} ${colors.tailwind.primaryHover} disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                  {editingId ? 'Update' : 'Add'} Address
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 && !showForm ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No saved addresses</h2>
            <p className="text-gray-600">Add an address to speed up checkout.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map(address => (
              <div key={address.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{address.label}</span>
                      {address.is_default && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{address.full_name}</p>
                    <p className="text-sm text-gray-600">
                      {address.address_line1}
                      {address.address_line2 && `, ${address.address_line2}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.postcode}
                    </p>
                    {address.phone && (
                      <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                        title="Set as default"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
