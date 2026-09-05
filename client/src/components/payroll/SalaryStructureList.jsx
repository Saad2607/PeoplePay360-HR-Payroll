import React from 'react';
import { Badge } from '../common/Badge';
import { Edit2, Trash2, Layers, CheckCircle2, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SalaryStructureList = ({ structures, onEditStructure, onDeleteStructure }) => {
  const { isHRManager } = useAuth();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 min-w-[700px]">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Structure Name & Code</th>
              <th className="py-3.5 px-4">Base Currency</th>
              <th className="py-3.5 px-4">Pay Frequency</th>
              <th className="py-3.5 px-4">Rules Included</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {structures.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-gray-900">{s.name}</div>
                  <span className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {s.code}
                  </span>
                </td>

                <td className="py-3.5 px-4 font-semibold text-gray-800">
                  {s.currency || 'INR'} (₹)
                </td>

                <td className="py-3.5 px-4 font-medium text-gray-700 capitalize">
                  {s.payFrequency || 'Monthly'}
                </td>

                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                    <Layers className="w-3.5 h-3.5 mr-1" /> {s.rules?.length || 4} Rule Components
                  </span>
                </td>

                <td className="py-3.5 px-4">
                  <Badge status={s.isActive !== false ? 'Active' : 'Expired'}>
                    {s.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </td>

                <td className="py-3.5 px-4 text-right space-x-1">
                  {isHRManager && (
                    <>
                      <button
                        onClick={() => onEditStructure(s)}
                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteStructure(s)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
