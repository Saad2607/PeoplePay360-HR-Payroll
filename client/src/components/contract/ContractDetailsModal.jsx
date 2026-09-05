import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { contractApi } from '../../api/contractApi';
import { FileText, Calendar, DollarSign, Building2, Briefcase, Clock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const ContractDetailsModal = ({ isOpen, onClose, contract }) => {
  if (!contract) return null;

  const empName = typeof contract.employee === 'object' ? contract.employee?.name : 'N/A';
  const empId = typeof contract.employee === 'object' ? contract.employee?.employeeId : 'N/A';
  const deptName = typeof contract.department === 'object' ? contract.department?.name : 'N/A';
  const posName = typeof contract.jobPosition === 'object' ? contract.jobPosition?.name : 'N/A';
  const schedName = typeof contract.workingSchedule === 'object' ? contract.workingSchedule?.name : 'N/A';

  const basic = contract.salaryStructure?.basic || 0;
  const allowances = contract.salaryStructure?.allowances || {};
  const deductions = contract.salaryStructure?.deductions || {};

  const totalAllowances = (allowances.houseRent || 0) + (allowances.transport || 0) + (allowances.medical || 0) + (allowances.other || 0);
  const totalDeductions = (deductions.tax || 0) + (deductions.providentFund || 0) + (deductions.insurance || 0) + (deductions.other || 0);
  const calculatedGross = basic + totalAllowances;
  const netSalary = calculatedGross - totalDeductions;

  // Applicable Contract Engine Tester State
  const [testPeriod, setTestPeriod] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [engineResult, setEngineResult] = useState(null);
  const [testingEngine, setTestingEngine] = useState(false);
  const [engineError, setEngineError] = useState('');

  const handleTestEngine = async () => {
    setTestingEngine(true);
    setEngineError('');
    setEngineResult(null);
    try {
      const empObjectId = typeof contract.employee === 'object' ? contract.employee._id : contract.employee;
      const res = await contractApi.getApplicableContract(empObjectId, testPeriod);
      setEngineResult(res.data);
    } catch (err) {
      setEngineError(err.message || 'No active contract for selected period');
    } finally {
      setTestingEngine(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Contract Details — ${contract.contractNumber}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-brand-100 text-brand-700 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono text-lg font-bold text-gray-900">{contract.contractNumber}</h3>
                <Badge status={contract.status}>{contract.status}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Assigned to <span className="font-semibold text-gray-800">{empName}</span> ({empId})
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-400 font-semibold uppercase">Total Wage</div>
            <div className="text-2xl font-bold text-gray-900">${contract.wage?.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{contract.wageType || 'Annual'}</div>
          </div>
        </div>

        {/* Grid info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
            <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-brand-600" /> Validity & Organization
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Start Date:</span>
                <span className="font-medium text-gray-900">
                  {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">End Date:</span>
                <span className="font-medium text-gray-900">
                  {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Indefinite'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Department:</span>
                <span className="font-semibold text-gray-900">{deptName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Job Position:</span>
                <span className="font-semibold text-gray-900">{posName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Working Schedule:</span>
                <span className="font-semibold text-gray-900">{schedName}</span>
              </div>
            </div>
          </div>

          {/* Salary Components */}
          <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
            <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-emerald-600" /> Salary Breakdown
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700">Basic Salary:</span>
                <span className="font-mono">${basic.toLocaleString()}</span>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <span className="text-emerald-700 font-semibold block mb-1">Allowances (+${totalAllowances})</span>
                <div className="pl-2 space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>House Rent:</span>
                    <span>${allowances.houseRent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport:</span>
                    <span>${allowances.transport || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medical:</span>
                    <span>${allowances.medical || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <span className="text-rose-700 font-semibold block mb-1">Deductions (-${totalDeductions})</span>
                <div className="pl-2 space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span>Income Tax:</span>
                    <span>${deductions.tax || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provident Fund:</span>
                    <span>${deductions.providentFund || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance:</span>
                    <span>${deductions.insurance || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Applicable Contract Engine Interactive Tester */}
        <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-indigo-600" /> Period-Specific Applicable Contract Engine
            </h4>
            <span className="text-[11px] font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
              POST /api/contracts/applicable
            </span>
          </div>
          <p className="text-xs text-indigo-700">
            Verify which contract applies to this employee for any custom payroll period.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="date"
              value={testPeriod.startDate}
              onChange={(e) => setTestPeriod({ ...testPeriod, startDate: e.target.value })}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 text-xs w-full sm:w-auto"
            />
            <span className="text-xs text-indigo-500">to</span>
            <input
              type="date"
              value={testPeriod.endDate}
              onChange={(e) => setTestPeriod({ ...testPeriod, endDate: e.target.value })}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 text-xs w-full sm:w-auto"
            />
            <button
              onClick={handleTestEngine}
              disabled={testingEngine}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition w-full sm:w-auto"
            >
              {testingEngine ? 'Evaluating...' : 'Evaluate Applicable Contract'}
            </button>
          </div>

          {engineResult && (
            <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> Applicable Contract Identified: {engineResult.contractNumber}
              </div>
              <div>Wage: ${engineResult.wage} | Status: {engineResult.status}</div>
            </div>
          )}

          {engineError && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1 text-rose-600" /> {engineError}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
