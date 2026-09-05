import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { salaryStructureApi } from '../../api/salaryStructureApi';
import { Loader2, AlertCircle } from 'lucide-react';

export const SalaryStructureFormModal = ({ isOpen, onClose, structureToEdit = null, onSuccess }) => {
  const isEditing = !!structureToEdit;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    currency: 'INR',
    payFrequency: 'Monthly',
    description: '',
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (structureToEdit) {
      setFormData({
        name: structureToEdit.name || '',
        code: structureToEdit.code || '',
        currency: structureToEdit.currency || 'INR',
        payFrequency: structureToEdit.payFrequency || 'Monthly',
        description: structureToEdit.description || '',
        isActive: structureToEdit.isActive !== undefined ? structureToEdit.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        currency: 'INR',
        payFrequency: 'Monthly',
        description: '',
        isActive: true,
      });
    }
    setError('');
  }, [structureToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Structure name is required');
      return;
    }
    if (!formData.code.trim()) {
      setError('Structure code is required (e.g. STD_TECH_2026)');
      return;
    }

    setSubmitting(true);
    try {
      let result;
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
      };

      if (isEditing) {
        result = await salaryStructureApi.update(structureToEdit._id, payload);
      } else {
        result = await salaryStructureApi.create(payload);
      }

      onSuccess(result.message || `Salary structure ${isEditing ? 'updated' : 'created'}`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save salary structure');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Salary Structure (${formData.code})` : 'Create Salary Structure'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Structure Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Standard Tech Salary Structure"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Structure Code *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. STD_TECH_2026"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Base Currency
            </label>
            <input
              type="text"
              readOnly
              value="INR (₹)"
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 bg-gray-100 text-sm font-semibold font-mono text-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Pay Frequency
            </label>
            <select
              value={formData.payFrequency}
              onChange={(e) => setFormData({ ...formData, payFrequency: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Monthly">Monthly</option>
              <option value="Bi-Weekly">Bi-Weekly</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Description (Optional)
          </label>
          <textarea
            rows="2"
            placeholder="Enter structure details and applicable departments..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Structure'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
