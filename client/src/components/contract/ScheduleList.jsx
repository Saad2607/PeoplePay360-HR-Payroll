import React from 'react';
import { Badge } from '../common/Badge';
import { Clock, Calendar, Edit2, Trash2, Users, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ScheduleList = ({ schedules = [], onEditSchedule, onDeleteSchedule }) => {
  const { canManageHR } = useAuth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 min-w-[700px]">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Schedule Name & Type</th>
              <th className="py-3.5 px-4">Active Working Days</th>
              <th className="py-3.5 px-4">Daily Hours & Break</th>
              <th className="py-3.5 px-4 text-center">Calculated Weekly Hours</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schedules.map((sch) => {
              const workingDays = sch.weeklyWorkingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
              const daysCount = workingDays.length;

              return (
                <tr key={sch._id} className="hover:bg-slate-50/80 transition">
                  {/* Name & Type */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-900">{sch.name}</div>
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-700">
                      {sch.type || 'Standard'}
                    </span>
                  </td>

                  {/* Active Working Days */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((shortDay, idx) => {
                        const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                        const isActive = workingDays.includes(fullDays[idx]);

                        return (
                          <span
                            key={shortDay}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isActive
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-gray-100 text-gray-400 opacity-60'
                            }`}
                          >
                            {shortDay}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      {daysCount} {daysCount === 1 ? 'day' : 'days'} / week
                    </span>
                  </td>

                  {/* Daily Hours & Break */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center text-xs font-semibold text-gray-800">
                      <Clock className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                      <span>
                        {sch.startTime || '09:00'} - {sch.endTime || '17:00'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Break: <span className="font-medium text-gray-700">{sch.breakDuration ?? 60} mins</span>
                    </div>
                  </td>

                  {/* Calculated Weekly Hours */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="text-base font-extrabold">{sch.calculatedWeeklyHours ?? 40}</span>
                      <span className="text-xs font-semibold ml-1 text-emerald-600">hrs/wk</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <Badge status={sch.isActive !== false ? 'Active' : 'Expired'}>
                      {sch.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right space-x-1">
                    {canManageHR ? (
                      <>
                        <button
                          onClick={() => onEditSchedule(sch)}
                          title="Edit Schedule"
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSchedule(sch)}
                          title="Delete Schedule"
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] font-mono text-gray-400 italic px-2 py-1 bg-gray-50 rounded-lg">
                        Read-Only
                      </span>
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
