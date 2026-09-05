import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { timeOffRequestApi } from '../../api/timeOffRequestApi';
import { timeOffTypeApi } from '../../api/timeOffTypeApi';
import { employeeApi } from '../../api/employeeApi';
import { useAuth } from '../../context/AuthContext';
import { Loader2, AlertCircle, Calendar } from 'lucide-react';

export const TimeOffRequestFormModal = ({ isOpen, onClose, onSuccess }) => {
  const { isHRManager, user } = useAuth();

  const [formData, setFormData] = useState({
    employeeId: '',
    timeOffTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    duration: 1,
    reason: '',
  });

  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoadingLookups(true);
      try {
        const [typeRes, empRes] = await Promise.all([
          timeOffTypeApi.getAll(),
          isHRManager ? employeeApi.getAll({ limit: 100 }) : Promise.resolve({ data: [] }),
        ]);
        setTypes(typeRes.data || []);
        setEmployees(empRes.data || []);

        if (typeRes.data?.length > 0) {
          setFormData((prev) => ({ ...prev, timeOffTypeId: typeRes.data[0]._id }));
        }
      } catch (err) {
        setError('Failed to load leave types');
      } finally {
        setLoadingLookups(false);
      }
    };
    loadData();
  }, [isOpen, isHRManager]);

  // Auto-calculate duration roughly when start and end date change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) {
        setFormData((prev) => ({ ...prev, duration: diffDays }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.timeOffTypeId) {
      setError('Time off type is required');
      return;
    }
    if (!formData.reason.trim()) {
      setError('Please provide a reason for your leave request');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date cannot be earlier than start date');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: isHRManager && formData.employeeId ? formData.employeeId : undefined,
        timeOffTypeId: formData.timeOffTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration: Number(formData.duration),
        reason: formData.reason.trim(),
      };

      const res = await timeOffRequestApi.create(payload);
      onSuccess(res.message || 'Leave request submitted successfully');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Time Off / Leave Request"
      maxWidth="max-w-md"
    >
      {loadingLookups ? (
        <div className="p-8 text-center flex items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600 mr-2" />
          Loading leave types...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
            </div>
          )}

          {/* HR On-behalf employee selector */}
          {isHRManager && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Select Employee (HR Admin)
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Myself ({user?.name}) --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Time Off Type *
            </label>
            <select
              required
              value={formData.timeOffTypeId}
              onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {types.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Duration (Days / Hours) *
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              required
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Reason for Leave *
            </label>
            <textarea
              rows="3"
              required
              placeholder="e.g. Annual family vacation / Medical checkup..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
              Submit Request
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
