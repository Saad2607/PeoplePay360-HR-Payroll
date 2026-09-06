import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { salaryRuleApi } from '../../api/salaryRuleApi';
import { Sliders, AlertCircle, Loader2 } from 'lucide-react';

const CATEGORIES = ['Basic', 'Allowances', 'Gross', 'Deductions', 'Net'];
const COMPUTATION_TYPES = ['Fixed amount', 'Percentage', 'Formula'];

export const SalaryRuleFormModal = ({ isOpen, onClose, ruleToEdit = null, onSuccess }) => {
  const isEditing = !!ruleToEdit;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Allowances',
    sequence: 20,
    computationType: 'Fixed amount',
    amount: 0,
    percentageBase: 'BASIC',
    formula: '',
    description: '',
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ruleToEdit) {
      setFormData({
        name: ruleToEdit.name || '',
        code: ruleToEdit.code || '',
        category: ruleToEdit.category || 'Allowances',
        sequence: ruleToEdit.sequence ?? 20,
        computationType: ruleToEdit.computationType || 'Fixed amount',
        amount: ruleToEdit.amount ?? 0,
        percentageBase: ruleToEdit.percentageBase || 'BASIC',
        formula: ruleToEdit.formula || '',
        description: ruleToEdit.description || '',
        isActive: ruleToEdit.isActive !== undefined ? ruleToEdit.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        category: 'Allowances',
        sequence: 20,
        computationType: 'Fixed amount',
        amount: 0,
        percentageBase: 'BASIC',
        formula: '',
        description: '',
        isActive: true,
      });
    }
    setError('');
  }, [ruleToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Rule name is required');
      return;
    }
    if (!formData.code.trim()) {
      setError('Rule code is required (e.g. HRA, PF)');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        amount: Number(formData.amount) || 0,
        sequence: Number(formData.sequence) || 10,
      };

      let result;
      if (isEditing) {
        result = await salaryRuleApi.update(ruleToEdit._id, payload);
      } else {
        result = await salaryRuleApi.create(payload);
      }

      onSuccess(result.message || `Salary rule ${isEditing ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save salary rule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Salary Rule (${formData.code})` : 'Create New Salary Rule'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Rule Name & Code */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. House Rent Allowance"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Code * (Uppercase)
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. HRA, PF, TAX"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold uppercase"
            />
          </div>
        </div>

        {/* Category & Sequence */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Sequence (Order) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.sequence}
              onChange={(e) => setFormData({ ...formData, sequence: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
        </div>

        {/* Computation Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Computation Method *
          </label>
          <select
            value={formData.computationType}
            onChange={(e) => setFormData({ ...formData, computationType: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {COMPUTATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic fields based on computationType */}
        {formData.computationType === 'Fixed amount' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Fixed Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              placeholder="e.g. 5000"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        {formData.computationType === 'Percentage' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                placeholder="e.g. 12"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Percentage Base Rule
              </label>
              <input
                type="text"
                value={formData.percentageBase}
                onChange={(e) => setFormData({ ...formData, percentageBase: e.target.value.toUpperCase() })}
                placeholder="e.g. BASIC or GROSS"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono uppercase"
              />
            </div>
          </div>
        )}

        {formData.computationType === 'Formula' && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Formula Expression
            </label>
            <input
              type="text"
              value={formData.formula}
              onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
              placeholder="e.g. BASIC + HRA * 0.1"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Description
          </label>
          <textarea
            rows="2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief explanation of the calculation policy..."
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="isActiveRule"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
          />
          <label htmlFor="isActiveRule" className="text-xs font-medium text-gray-700">
            Active Salary Rule (Applied during payrun computation)
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition disabled:opacity-50 flex items-center"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
            {isEditing ? 'Save Changes' : 'Create Rule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
