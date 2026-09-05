import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { timeOffTypeApi } from '../../api/timeOffTypeApi';
import { Loader2, AlertCircle } from 'lucide-react';

export const TimeOffTypeFormModal = ({ isOpen, onClose, typeToEdit = null, onSuccess }) => {
  const isEditing = !!typeToEdit;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    unit: 'days',
    allocationRequired: true,
    approvalWorkflow: 'Manager',
    payrollIntegration: {
      affectsPayroll: true,
      isPaid: true,
    },
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeToEdit) {
      setFormData({
        name: typeToEdit.name || '',
        code: typeToEdit.code || '',
        unit: typeToEdit.unit || 'days',
        allocationRequired: typeToEdit.allocationRequired !== undefined ? typeToEdit.allocationRequired : true,
        approvalWorkflow: typeToEdit.approvalWorkflow || 'Manager',
        payrollIntegration: {
          affectsPayroll: typeToEdit.payrollIntegration?.affectsPayroll !== undefined ? typeToEdit.payrollIntegration.affectsPayroll : true,
          isPaid: typeToEdit.payrollIntegration?.isPaid !== undefined ? typeToEdit.payrollIntegration.isPaid : true,
        },
        isActive: typeToEdit.isActive !== undefined ? typeToEdit.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        unit: 'days',
        allocationRequired: true,
        approvalWorkflow: 'Manager',
        payrollIntegration: {
          affectsPayroll: true,
          isPaid: true,
        },
        isActive: true,
      });
    }
    setError('');
  }, [typeToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Time off type name is required');
      return;
    }
    if (!formData.code.trim()) {
      setError('Code is required (e.g. PTO, SICK)');
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
        result = await timeOffTypeApi.update(typeToEdit._id, payload);
      } else {
        result = await timeOffTypeApi.create(payload);
      }

      onSuccess(result.message || `Time off type ${isEditing ? 'updated' : 'created'}`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save time off type');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Time Off Type (${formData.code})` : 'Create Time Off Type'}
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
            Type Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Paid Time Off"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Code (e.g. PTO, SICK, UNPAID) *
          </label>
          <input
            type="text"
            required
            placeholder="PTO"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="days">Days</option>
              <option value="hours">Hours</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Approval Workflow
            </label>
            <select
              value={formData.approvalWorkflow}
              onChange={(e) => setFormData({ ...formData, approvalWorkflow: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="None">None (Auto-approve)</option>
              <option value="Manager">Manager Only</option>
              <option value="HR">HR Only</option>
              <option value="Manager_and_HR">Manager & HR</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.allocationRequired}
              onChange={(e) => setFormData({ ...formData, allocationRequired: e.target.checked })}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="font-semibold text-gray-700">Allocation Required Before Requesting</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.payrollIntegration.isPaid}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  payrollIntegration: { ...formData.payrollIntegration, isPaid: e.target.checked },
                })
              }
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="font-semibold text-gray-700">Is Paid Leave</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.payrollIntegration.affectsPayroll}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  payrollIntegration: { ...formData.payrollIntegration, affectsPayroll: e.target.checked },
                })
              }
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span className="font-semibold text-gray-700">Affects Payroll Engine Deductions</span>
          </label>
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
            {isEditing ? 'Save Changes' : 'Create Type'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
