// Delivery Slot Manager - Admin component to manage delivery slot templates

import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Calendar, MapPin, Edit2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DeliverySlotTemplate, DeliverySlotFormData, DAY_NAMES } from './types';

interface DeliverySlotManagerProps {
  onTemplateCreate?: (template: DeliverySlotTemplate) => void;
  onTemplateUpdate?: (template: DeliverySlotTemplate) => void;
}

export default function DeliverySlotManager({
  onTemplateCreate,
  onTemplateUpdate,
}: DeliverySlotManagerProps) {
  const [templates, setTemplates] = useState<DeliverySlotTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DeliverySlotTemplate | null>(null);
  const [formData, setFormData] = useState<DeliverySlotFormData>({
    name: '',
    day_of_week: 1, // Monday
    start_time: '09:00',
    end_time: '12:00',
    max_bookings: 5,
    is_active: true,
    zones: [],
    delivery_fee: 0,
  });

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('delivery_slot_templates')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (!error && data) {
      setTemplates(data);
    }
    setIsLoading(false);
  };

  const handleOpenModal = (template?: DeliverySlotTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        day_of_week: template.day_of_week,
        start_time: template.start_time,
        end_time: template.end_time,
        max_bookings: template.max_bookings,
        is_active: template.is_active,
        zones: template.zones || [],
        delivery_fee: template.delivery_fee || 0,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '12:00',
        max_bookings: 5,
        is_active: true,
        zones: [],
        delivery_fee: 0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const templateData = {
      name: formData.name,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      max_bookings: formData.max_bookings,
      is_active: formData.is_active,
      zones: formData.zones.length > 0 ? formData.zones : null,
      delivery_fee: formData.delivery_fee,
    };

    if (editingTemplate) {
      // Update
      const { data, error } = await supabase
        .from('delivery_slot_templates')
        .update(templateData)
        .eq('id', editingTemplate.id)
        .select()
        .single();

      if (!error && data) {
        onTemplateUpdate?.(data);
        loadTemplates();
      }
    } else {
      // Create
      const { data, error } = await supabase
        .from('delivery_slot_templates')
        .insert([templateData])
        .select()
        .single();

      if (!error && data) {
        onTemplateCreate?.(data);
        loadTemplates();
      }
    }

    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this delivery slot template?');
    if (!confirmed) return;

    const { error } = await supabase.from('delivery_slot_templates').delete().eq('id', id);

    if (!error) {
      loadTemplates();
    }
  };

  const handleToggleActive = async (template: DeliverySlotTemplate) => {
    const { error } = await supabase
      .from('delivery_slot_templates')
      .update({ is_active: !template.is_active })
      .eq('id', template.id);

    if (!error) {
      loadTemplates();
    }
  };

  // Group templates by day
  const groupedTemplates = templates.reduce((groups, template) => {
    const day = template.day_of_week;
    if (!groups[day]) groups[day] = [];
    groups[day].push(template);
    return groups;
  }, {} as Record<number, DeliverySlotTemplate[]>);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2">
              <Clock className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm sm:text-lg">Delivery Slot Manager</h2>
              <p className="text-teal-100 text-xs sm:text-sm">Configure available delivery times</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Slot</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No delivery slots configured</h3>
            <p className="text-gray-500 text-sm mb-4">
              Create delivery slot templates to let customers choose delivery times.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium"
            >
              Create First Slot
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {[0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
              const dayTemplates = groupedTemplates[dayNum] || [];
              if (dayTemplates.length === 0) return null;

              return (
                <div key={dayNum}>
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <Calendar size={16} className="text-teal-600" />
                    {DAY_NAMES[dayNum]}
                  </h3>
                  <div className="space-y-2">
                    {dayTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          template.is_active
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-100 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-800">
                              {template.start_time} - {template.end_time}
                            </p>
                            <p className="text-xs text-gray-500">{template.name}</p>
                          </div>
                          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                              Max: {template.max_bookings}
                            </span>
                            {template.delivery_fee && template.delivery_fee > 0 && (
                              <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded">
                                £{template.delivery_fee.toFixed(2)}
                              </span>
                            )}
                            {template.zones && template.zones.length > 0 && (
                              <span className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                                <MapPin size={12} />
                                {template.zones.length} zones
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(template)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                              template.is_active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {template.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => handleOpenModal(template)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800">
                {editingTemplate ? 'Edit Delivery Slot' : 'Create Delivery Slot'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slot Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Morning Delivery"
                />
              </div>

              {/* Day of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) =>
                    setFormData({ ...formData, day_of_week: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  {DAY_NAMES.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Max Bookings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Bookings Per Slot
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_bookings}
                  onChange={(e) =>
                    setFormData({ ...formData, max_bookings: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Delivery Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Fee (£)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.delivery_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, delivery_fee: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (visible to customers)
                </label>
              </div>

              {/* Submit */}
              <div className="border-t pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  {editingTemplate ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
