import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { attendanceApi } from '../../api/attendanceApi';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

export const ManualCorrectionModal = ({ isOpen, onClose, attendanceRecord = null, onSuccess }) => {
  if (!attendanceRecord) return null;

  const empName = typeof attendanceRecord.employee === 'object' ? attendanceRecord.employee?.name : 'N/A';
  const empId = typeof attendanceRecord.employee === 'object' ? attendanceRecord.employee?.employeeId : '';

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [status, setStatus] = useState(attendanceRecord.status || 'Present');
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (attendanceRecord) {
      setCheckIn(attendanceRecord.checkIn ? new Date(attendanceRecord.checkIn).toISOString().slice(0, 16) : '');
      setCheckOut(attendanceRecord.checkOut ? new Date(attendanceRecord.checkOut).toISOString().slice(0, 16) : '');
      setStatus(attendanceRecord.status || 'Present');
      setReason('');
      setError('');
    }
  }, [attendanceRecord]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reason.trim() || reason.trim().length < 5) {
      setError('A correction reason of at least 5 characters is mandatory for audit trail logging');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        checkIn: checkIn ? new Date(checkIn).toISOString() : undefined,
        checkOut: checkOut ? new Date(checkOut).toISOString() : undefined,
        status,
        reason: reason.trim(),
      };

      const res = await attendanceApi.manualCorrection(attendanceRecord._id, payload);
      onSuccess(res.message || 'Attendance record corrected successfully');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update attendance record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manual Correction Audit — ${empName} (${empId})`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <span>
            All manual corrections are logged with your user identity and audit reason for compliance.
          </span>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Check-In Time
            </label>
            <input
              type="datetime-local"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Check-Out Time
            </label>
            <input
              type="datetime-local"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Half-Day">Half-Day</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-purple-900 uppercase mb-1">
            Correction Reason (Mandatory Audit Log) *
          </label>
          <textarea
            rows="3"
            required
            placeholder="e.g. Employee forgot to check out due to system outage..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Audit Correction
          </button>
        </div>
      </form>
    </Modal>
  );
};
