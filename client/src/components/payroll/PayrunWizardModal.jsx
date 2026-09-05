import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { payrunApi } from '../../api/payrunApi';
import { salaryStructureApi } from '../../api/salaryStructureApi';
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Users, ShieldCheck } from 'lucide-react';

export const PayrunWizardModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1 | 2 | 3

  // Step 1 State
  const [name, setName] = useState('');
  const [salaryStructureId, setSalaryStructureId] = useState('');
  const [period, setPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  });

  // Step 2 State (Eligible Employees)
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  // Step 3 State (Confirmation & Submission)
  const [structures, setStructures] = useState([]);
  const [loadingStructures, setLoadingStructures] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Reset wizard
    setStep(1);
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });
    setName(`Payrun — ${monthName} ${now.getFullYear()}`);
    setError('');

    const loadStructures = async () => {
      setLoadingStructures(true);
      try {
        const res = await salaryStructureApi.getAll();
        setStructures(res.data || []);
        if (res.data?.length > 0) {
          setSalaryStructureId(res.data[0]._id);
        }
      } catch (err) {
        setError('Failed to load salary structures');
      } finally {
        setLoadingStructures(false);
      }
    };

    loadStructures();
  }, [isOpen]);

  // Step 1 -> Step 2: Fetch eligible employees without creating payrun!
  const handleNextToStep2 = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Payrun name is required');
      return;
    }
    if (!salaryStructureId) {
      setError('Please select a salary structure');
      return;
    }
    if (new Date(period.endDate) < new Date(period.startDate)) {
      setError('Period end date cannot be earlier than start date');
      return;
    }

    setLoadingEligible(true);
    try {
      const res = await payrunApi.getEligibleEmployees({
        salaryStructureId,
        period,
      });

      const eligibleList = res.data?.eligibleEmployees || res.data || [];
      setEligibleEmployees(eligibleList);
      // Select all by default
      setSelectedEmployeeIds(eligibleList.map((e) => e.employeeId || e._id));
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to query eligible employees');
    } finally {
      setLoadingEligible(false);
    }
  };

  // Toggle single employee selection in Step 2
  const handleToggleEmployee = (id) => {
    if (selectedEmployeeIds.includes(id)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter((item) => item !== id));
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, id]);
    }
  };

  // Toggle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployeeIds(eligibleEmployees.map((emp) => emp.employeeId || emp._id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  // Step 2 -> Step 3
  const handleNextToStep3 = () => {
    if (selectedEmployeeIds.length === 0) {
      setError('Please select at least one eligible employee for this payrun');
      return;
    }
    setError('');
    setStep(3);
  };

  // Step 3 Confirmation: Create Payrun on Backend
  const handleConfirmCreatePayrun = async () => {
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name,
        salaryStructureId,
        period,
        selectedEmployees: selectedEmployeeIds,
      };

      const result = await payrunApi.create(payload);
      onSuccess(result.message || 'Payrun created successfully in Draft status');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create payrun');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStructureObj = structures.find((s) => s._id === salaryStructureId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`New Payrun Creation Wizard (Step ${step} of 3)`}
      maxWidth="max-w-3xl"
    >
      {/* Wizard Progress Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4 text-xs font-semibold">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-brand-600 font-bold' : 'text-gray-400'}`}>
          <span className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">1</span>
          <span>1. Structure & Period</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-brand-600 font-bold' : 'text-gray-400'}`}>
          <span className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">2</span>
          <span>2. Select Staff ({selectedEmployeeIds.length})</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-brand-600 font-bold' : 'text-gray-400'}`}>
          <span className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">3</span>
          <span>3. Confirm & Create</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {error}
        </div>
      )}

      {/* STEP 1: Select Structure & Period */}
      {step === 1 && (
        <form onSubmit={handleNextToStep2} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Payrun Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Salary Structure *
            </label>
            {loadingStructures ? (
              <div className="text-xs text-gray-500 py-2">Loading salary structures...</div>
            ) : (
              <select
                required
                value={salaryStructureId}
                onChange={(e) => setSalaryStructureId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {structures.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Pay Period Start Date *
              </label>
              <input
                type="date"
                required
                value={period.startDate}
                onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Pay Period End Date *
              </label>
              <input
                type="date"
                required
                value={period.endDate}
                onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loadingEligible}
              className="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loadingEligible ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Step 2: Query Eligible Staff <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Select Employees */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="flex items-center space-x-2 text-xs font-bold text-gray-700">
              <input
                type="checkbox"
                checked={selectedEmployeeIds.length === eligibleEmployees.length && eligibleEmployees.length > 0}
                onChange={handleSelectAll}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Select All Eligible Employees ({eligibleEmployees.length})</span>
            </label>
            <span className="text-xs text-brand-700 font-semibold">
              {selectedEmployeeIds.length} Selected
            </span>
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
            {eligibleEmployees.map((emp) => {
              const empId = emp.employeeId || emp._id;
              const isChecked = selectedEmployeeIds.includes(empId);
              return (
                <div
                  key={empId}
                  onClick={() => handleToggleEmployee(empId)}
                  className={`p-3 flex items-center justify-between cursor-pointer transition ${
                    isChecked ? 'bg-brand-50/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Handled by div click
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{emp.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{emp.employeeId || emp.email}</div>
                    </div>
                  </div>

                  <div className="text-xs text-right">
                    <div className="font-medium text-gray-700">{emp.departmentName || 'Active Contract'}</div>
                    <div className="text-[11px] text-emerald-600 font-semibold">Contract Valid</div>
                  </div>
                </div>
              );
            })}

            {eligibleEmployees.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                No eligible employees with active contracts found for the selected salary structure and period.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Step 1
            </button>
            <button
              type="button"
              onClick={handleNextToStep3}
              className="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition"
            >
              Step 3: Review Summary <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Confirm & Create Payrun */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-5 bg-brand-50/60 rounded-2xl border border-brand-200 space-y-3">
            <h4 className="font-bold text-gray-900 text-base flex items-center">
              <ShieldCheck className="w-5 h-5 text-brand-600 mr-2" /> Confirm Payrun Creation
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block">Payrun Name:</span>
                <span className="font-bold text-gray-900 text-sm">{name}</span>
              </div>

              <div>
                <span className="text-gray-500 block">Salary Structure:</span>
                <span className="font-semibold text-gray-800">{selectedStructureObj?.name || 'Selected Structure'}</span>
              </div>

              <div>
                <span className="text-gray-500 block">Period:</span>
                <span className="font-mono text-gray-900">
                  {new Date(period.startDate).toLocaleDateString()} — {new Date(period.endDate).toLocaleDateString()}
                </span>
              </div>

              <div>
                <span className="text-gray-500 block">Selected Employees:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {selectedEmployeeIds.length} Staff Members
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Confirming will create a new Payrun in <span className="font-semibold text-slate-700">Draft</span> status. You can compute, validate, and mark paid from the Payrun Console.
          </p>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Selection
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmCreatePayrun}
              className="inline-flex items-center px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm & Create Draft Payrun
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
