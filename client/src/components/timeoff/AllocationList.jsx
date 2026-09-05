import React from 'react';
import { Badge } from '../common/Badge';
import { Calendar, CheckCircle2, Clock, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AllocationList = ({ allocations, balances = [], onEditAllocation }) => {
  const { isHRManager } = useAuth();

  return (
    <div className="space-y-6">
      {/* Leave Balance Cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {balances.map((b, idx) => (
            <div key={b.timeOffTypeCode || b._id || idx} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
                <span>{b.timeOffTypeName || b.timeOffTypeCode}</span>
                <span className="font-mono text-[11px] bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded">
                  {b.unit || 'days'}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-extrabold text-gray-900">{b.remaining}</span>
                  <span className="text-xs text-gray-400 ml-1">left</span>
                </div>
                <div className="text-xs text-right text-gray-500">
                  <div>Allocated: <span className="font-semibold text-gray-800">{b.allocated}</span></div>
                  <div>Taken: <span className="font-semibold text-rose-600">{b.taken}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Allocations Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 min-w-[750px]">
            <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Time Off Type</th>
                <th className="py-3.5 px-4">Allocated</th>
                <th className="py-3.5 px-4">Taken</th>
                <th className="py-3.5 px-4">Remaining</th>
                <th className="py-3.5 px-4">Validity Period</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allocations.map((alloc, idx) => {
                const empName = typeof alloc.employee === 'object' ? alloc.employee?.name : 'N/A';
                const empId = typeof alloc.employee === 'object' ? alloc.employee?.employeeId : '';
                const typeName = typeof alloc.timeOffType === 'object' ? alloc.timeOffType?.name : 'N/A';
                const typeUnit = typeof alloc.timeOffType === 'object' ? alloc.timeOffType?.unit : 'days';

                const allocated = alloc.allocatedAmount || 0;
                const taken = alloc.takenAmount || 0;
                const remaining = alloc.remainingAmount !== undefined ? alloc.remainingAmount : (allocated - taken);

                return (
                  <tr key={alloc._id || idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{empName}</div>
                      {empId && <div className="text-xs font-mono text-gray-400">{empId}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{typeName}</div>
                      <div className="text-xs text-gray-400 capitalize">{typeUnit}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {allocated} {typeUnit}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-rose-600">
                      {taken} {typeUnit}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-700 bg-emerald-50/50 rounded py-1 px-2 fit-content">
                      {remaining} {typeUnit}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      <div>
                        Start: {alloc.validityPeriod?.startDate ? new Date(alloc.validityPeriod.startDate).toLocaleDateString() : 'N/A'}
                      </div>
                      <div>
                        End: {alloc.validityPeriod?.endDate ? new Date(alloc.validityPeriod.endDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={alloc.status}>{alloc.status || 'Approved'}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
