import React from 'react';
import { Badge } from '../common/Badge';
import { Sliders, Edit2, Trash2, ArrowUpDown, Percent, Calculator, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SalaryRuleList = ({ rules = [], onEditRule, onDeleteRule }) => {
  const { canManageSalaryRules } = useAuth();

  // Category badge colors
  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Basic':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Allowances':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Gross':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Deductions':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Net':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Sort rules by sequence ascending
  const sortedRules = [...rules].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 min-w-[760px]">
          <thead className="bg-slate-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            <tr>
              <th className="py-3.5 px-4 w-16 text-center">Seq #</th>
              <th className="py-3.5 px-4">Rule Name & Code</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Computation Method</th>
              <th className="py-3.5 px-4">Value / Computation Expression</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRules.map((rule) => (
              <tr key={rule._id} className="hover:bg-slate-50/80 transition">
                {/* Sequence */}
                <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-500">
                  <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 inline-flex items-center justify-center text-xs">
                    {rule.sequence ?? 10}
                  </span>
                </td>

                {/* Name & Code */}
                <td className="py-3.5 px-4">
                  <div className="font-bold text-gray-900">{rule.name}</div>
                  <span className="text-xs font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {rule.code}
                  </span>
                </td>

                {/* Category */}
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getCategoryBadge(
                      rule.category
                    )}`}
                  >
                    {rule.category}
                  </span>
                </td>

                {/* Computation Method */}
                <td className="py-3.5 px-4 font-medium text-gray-700">
                  <div className="flex items-center space-x-1.5">
                    {rule.computationType === 'Percentage' && (
                      <Percent className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    {rule.computationType === 'Formula' && (
                      <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    {rule.computationType === 'Fixed amount' && (
                      <Hash className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>{rule.computationType}</span>
                  </div>
                </td>

                {/* Value / Expression */}
                <td className="py-3.5 px-4 font-mono text-xs text-gray-800">
                  {rule.computationType === 'Percentage' ? (
                    <span className="bg-amber-50 text-amber-900 px-2 py-1 rounded-md font-semibold">
                      {rule.amount}% of {rule.percentageBase || 'BASIC'}
                    </span>
                  ) : rule.computationType === 'Formula' ? (
                    <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-md">
                      {rule.formula || 'Calculated in Engine'}
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-900 px-2 py-1 rounded-md font-semibold">
                      ₹{Number(rule.amount || 0).toLocaleString('en-IN')} (Fixed)
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <Badge status={rule.isActive !== false ? 'Active' : 'Expired'}>
                    {rule.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right space-x-1">
                  {canManageSalaryRules ? (
                    <>
                      <button
                        onClick={() => onEditRule(rule)}
                        title="Edit Salary Rule"
                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRule(rule)}
                        title="Delete Salary Rule"
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
