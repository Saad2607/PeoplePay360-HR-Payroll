import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { timeOffRequestApi } from '../../api/timeOffRequestApi';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const ApprovalActionModal = ({ isOpen, onClose, request = null, actionType = 'approve', onSuccess }) => {
  if (!request) return null;

  const isApprove = actionType === 'approve';
  const empName = typeof request.employee === 'object' ? request.employee?.name : 'N/A';
  const typeName = typeof request.timeOffType === 'object' ? request.timeOffType?.name : 'N/A';

  const [refusalReason, setRefusalReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAction = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let result;
      if (isApprove) {
        result = await timeOffRequestApi.approve(request._id);
      } else {
        result = await timeOffRequestApi.refuse(request._id, refusalReason.trim());
      }

      onSuccess(result.message || `Request ${isApprove ? 'approved' : 'refused'} successfully`);
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${actionType} request`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? 'Approve Leave Request' : 'Refuse Leave Request'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleAction} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Employee:</span>
            <span className="font-bold text-gray-900">{empName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Leave Type:</span>
            <span className="font-semibold text-gray-900">{typeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Duration:</span>
            <span className="font-semibold text-brand-600">{request.duration} days/hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dates:</span>
            <span className="text-gray-800 font-mono">
              {new Date(request.startDate).toLocaleDateString()} — {new Date(request.endDate).toLocaleDateString()}
            </span>
          </div>
          {request.reason && (
            <div className="pt-2 border-t border-gray-200 text-gray-700 italic">
              "{request.reason}"
            </div>
          )}
        </div>

        {isApprove ? (
          <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium">
            Approving this request will automatically update the employee's leave balance in the backend.
          </p>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-rose-900 uppercase mb-1">
              Refusal Reason (Optional)
            </label>
            <textarea
              rows="3"
              placeholder="Provide reason for refusing leave request..."
              value={refusalReason}
              onChange={(e) => setRefusalReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-rose-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        )}

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
              isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isApprove ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            {isApprove ? 'Confirm Approval' : 'Confirm Refusal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
