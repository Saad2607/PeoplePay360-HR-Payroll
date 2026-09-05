import React from 'react';
import { Badge } from '../common/Badge';
import { Clock, AlertTriangle, Edit3, User, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AttendanceList = ({ attendanceRecords, onManualCorrection }) => {
  const { isHRManager } = useAuth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Check-In</th>
              <th className="py-3.5 px-4">Check-Out</th>
              <th className="py-3.5 px-4">Worked Hours</th>
              <th className="py-3.5 px-4">Overtime</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attendanceRecords.map((rec) => {
              const empName = typeof rec.employee === 'object' ? rec.employee?.name : 'N/A';
              const empId = typeof rec.employee === 'object' ? rec.employee?.employeeId : '';
              const isMissingCheckout = rec.missingCheckout || (rec.checkIn && !rec.checkOut && rec.status !== 'On Leave');
              const isManualEdit = rec.isManuallyCorrected || rec.manualCorrection?.correctedBy;

              return (
                <tr
                  key={rec._id}
                  className={`hover:bg-slate-50/80 transition ${
                    isMissingCheckout ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                    {rec.date ? new Date(rec.date).toLocaleDateString() : 'N/A'}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900">{empName}</div>
                    {empId && <div className="text-xs font-mono text-gray-400">{empId}</div>}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs text-emerald-700 font-semibold">
                    {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs text-indigo-700 font-semibold">
                    {rec.checkOut ? (
                      new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ) : isMissingCheckout ? (
                      <span className="text-amber-700 font-sans font-semibold flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" /> Missing
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    {rec.workedHours !== undefined && rec.workedHours !== null ? `${rec.workedHours.toFixed(2)} hrs` : '0.00 hrs'}
                  </td>

                  <td className="py-3.5 px-4 text-xs font-mono">
                    {rec.overtimeHours > 0 ? (
                      <span className="text-emerald-700 font-bold px-2 py-0.5 bg-emerald-50 rounded">
                        +{rec.overtimeHours.toFixed(2)} hrs
                      </span>
                    ) : (
                      <span className="text-gray-400">0.00</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-1">
                      <Badge status={rec.status}>{rec.status || 'Present'}</Badge>
                      {isManualEdit && (
                        <span title="Manually edited record" className="text-xs text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                          Edited
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {isHRManager && (
                      <button
                        onClick={() => onManualCorrection(rec)}
                        title="Manual Correction (HR Audit)"
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Correct
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
