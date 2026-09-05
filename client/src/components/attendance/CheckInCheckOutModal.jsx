import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { attendanceApi } from '../../api/attendanceApi';
import { employeeApi } from '../../api/employeeApi';
import { useAuth } from '../../context/AuthContext';
import { Loader2, LogIn, LogOut, AlertCircle } from 'lucide-react';

export const CheckInCheckOutModal = ({ isOpen, onClose, mode = 'checkIn', onSuccess }) => {
  const { isHRManager, user } = useAuth();
  const isCheckIn = mode === 'checkIn';

  const [employeeId, setEmployeeId] = useState('');
  const [timestamp, setTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Reset fields
    setTimestamp(new Date().toISOString().slice(0, 16));
    setNotes('');
    setError('');

    if (isHRManager) {
      setLoadingEmployees(true);
      employeeApi.getAll({ limit: 100 })
        .then((res) => setEmployees(res.data || []))
        .catch(() => setEmployees([]))
        .finally(() => setLoadingEmployees(false));
    }
  }, [isOpen, isHRManager]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        employeeId: isHRManager && employeeId ? employeeId : undefined,
        [isCheckIn ? 'checkIn' : 'checkOut']: new Date(timestamp).toISOString(),
        notes: notes.trim() || undefined,
      };

      let result;
      if (isCheckIn) {
        result = await attendanceApi.checkIn(payload);
      } else {
        result = await attendanceApi.checkOut(payload);
      }

      onSuccess(result.message || `${isCheckIn ? 'Check-In' : 'Check-Out'} successful`);
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isCheckIn ? 'check in' : 'check out'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCheckIn ? 'Employee Check-In Console' : 'Employee Check-Out Console'}
      maxWidth="max-w-md"
    >
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
            {loadingEmployees ? (
              <div className="text-xs text-gray-500 py-2">Loading employees...</div>
            ) : (
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Myself ({user?.name}) --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            {isCheckIn ? 'Check-In Date & Time' : 'Check-Out Date & Time'}
          </label>
          <input
            type="datetime-local"
            required
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Notes / Reason (Optional)
          </label>
          <textarea
            rows="2"
            placeholder="Add any shift or check-in notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
            className={`inline-flex items-center px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition disabled:opacity-50 ${
              isCheckIn ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isCheckIn ? (
              <LogIn className="w-4 h-4 mr-2" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            {isCheckIn ? 'Confirm Check-In' : 'Confirm Check-Out'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
