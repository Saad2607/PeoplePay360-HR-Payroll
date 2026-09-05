import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { allocationApi } from '../../api/allocationApi';
import { employeeApi } from '../../api/employeeApi';
import { timeOffTypeApi } from '../../api/timeOffTypeApi';
import { Loader2, AlertCircle } from 'lucide-react';

export const AllocationFormModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    employee: '',
    timeOffType: '',
    allocatedAmount: 15,
    validityPeriod: {
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    },
    status: 'Approved',
    notes: '',
  });

  const [employees, setEmployees] = useState([]);
  const [types, setTypes] = useState([]);

  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoadingLookups(true);
      try {
        const [empRes, typeRes] = await Promise.all([
          employeeApi.getAll({ limit: 100 }),
          timeOffTypeApi.getAll(),
        ]);
        setEmployees(empRes.data || []);
        setTypes(typeRes.data || []);
      } catch (err) {
        setError('Failed to load employee or time off type references');
      } finally {
        setLoadingLookups(false);
      }
    };
    loadData();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.employee) {
      setError('Employee selection is required');
      return;
    }
    if (!formData.timeOffType) {
      setError('Time off type is required');
      return;
    }
    if (!formData.allocatedAmount || Number(formData.allocatedAmount) <= 0) {
      setError('Allocated amount must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        allocatedAmount: Number(formData.allocatedAmount),
      };

      const res = await allocationApi.create(payload);
      onSuccess(res.message || 'Leave allocation granted successfully');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create leave allocation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Leave Allocation"
      maxWidth="max-w-lg"
    >
      {loadingLookups ? (
        <div className="p-8 text-center flex items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600 mr-2" />
          Loading employees and time off types...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Select Employee *
            </label>
            <select
              required
              value={formData.employee}
              onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Select Employee --</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Time Off Type *
            </label>
            <select
              required
              value={formData.timeOffType}
              onChange={(e) => setFormData({ ...formData, timeOffType: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Select Time Off Type --</option>
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Allocated Amount (Days/Hours) *
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              required
              value={formData.allocatedAmount}
              onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Validity Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.validityPeriod.startDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    validityPeriod: { ...formData.validityPeriod, startDate: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Validity End Date *
              </label>
              <input
                type="date"
                required
                value={formData.validityPeriod.endDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    validityPeriod: { ...formData.validityPeriod, endDate: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Annual PTO allocation for calendar year 2026..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              Grant Allocation
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
