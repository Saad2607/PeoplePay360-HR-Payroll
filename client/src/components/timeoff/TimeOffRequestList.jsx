import React from 'react';
import { Badge } from '../common/Badge';
import { CheckCircle2, XCircle, Clock, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TimeOffRequestList = ({ requests, onApprove, onRefuse, onCancel }) => {
  const { isHRManager, user } = useAuth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 min-w-[750px]">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Time Off Type</th>
              <th className="py-3.5 px-4">Dates & Duration</th>
              <th className="py-3.5 px-4">Reason</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Approval Workflow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => {
              const empName = typeof req.employee === 'object' ? req.employee?.name : 'N/A';
              const empId = typeof req.employee === 'object' ? req.employee?.employeeId : '';
              const typeName = typeof req.timeOffType === 'object' ? req.timeOffType?.name : 'N/A';
              const typeUnit = typeof req.timeOffType === 'object' ? req.timeOffType?.unit : 'days';

              const isPending = req.status === 'Pending';
              const isApproved = req.status === 'Approved';
              const isRefused = req.status === 'Refused';
              const isCancelled = req.status === 'Cancelled';

              const isOwnRequest = typeof req.employee === 'object' ? req.employee?._id === user?.employee?._id : true;

              return (
                <tr key={req._id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900">{empName}</div>
                    {empId && <div className="text-xs font-mono text-gray-400">{empId}</div>}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-900">{typeName}</div>
                    <div className="text-xs text-gray-400 capitalize">{typeUnit}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-gray-900">
                      {req.startDate ? new Date(req.startDate).toLocaleDateString() : 'N/A'} —{' '}
                      {req.endDate ? new Date(req.endDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs font-semibold text-brand-600">
                      {req.duration} {typeUnit}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="text-xs text-gray-700 italic truncate" title={req.reason}>
                      "{req.reason || 'No reason specified'}"
                    </div>
                    {req.refusalReason && (
                      <div className="text-[11px] text-rose-600 font-medium mt-1">
                        Refusal Reason: {req.refusalReason}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge status={req.status}>{req.status || 'Pending'}</Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1">
                    {isPending && isHRManager && (
                      <>
                        <button
                          onClick={() => onApprove(req)}
                          title="Approve Leave Request"
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => onRefuse(req)}
                          title="Refuse Leave Request"
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Refuse
                        </button>
                      </>
                    )}

                    {isPending && isOwnRequest && !isHRManager && (
                      <button
                        onClick={() => onCancel(req)}
                        title="Cancel Request"
                        className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
