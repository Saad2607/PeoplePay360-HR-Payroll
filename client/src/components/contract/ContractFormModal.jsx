import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { contractApi } from '../../api/contractApi';
import { employeeApi } from '../../api/employeeApi';
import { departmentApi } from '../../api/departmentApi';
import { positionApi } from '../../api/positionApi';
import { scheduleApi } from '../../api/scheduleApi';
import { Loader2, AlertCircle, Calculator } from 'lucide-react';

export const ContractFormModal = ({ isOpen, onClose, contractToEdit = null, preselectedEmployee = null, onSuccess }) => {
  const isEditing = !!contractToEdit;

  const [formData, setFormData] = useState({
    contractNumber: '',
    employee: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    wage: 75000,
    wageType: 'Annual',
    salaryStructure: {
      basic: 55000,
      allowances: { houseRent: 10000, transport: 5000, medical: 5000, other: 0 },
      deductions: { tax: 10000, providentFund: 4000, insurance: 1000, other: 0 },
    },
    department: '',
    jobPosition: '',
    workingSchedule: '',
    status: 'Active',
    notes: '',
  });

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoadingOptions(true);
      try {
        const [empRes, deptRes, schedRes] = await Promise.all([
          employeeApi.getAll({ limit: 100 }),
          departmentApi.getAll(),
          scheduleApi.getAll(),
        ]);

        setEmployees(empRes.data || []);
        setDepartments(deptRes.data || []);
        setSchedules(schedRes.data || []);

        if (contractToEdit) {
          const empId = typeof contractToEdit.employee === 'object' ? contractToEdit.employee?._id : contractToEdit.employee;
          const deptId = typeof contractToEdit.department === 'object' ? contractToEdit.department?._id : contractToEdit.department;
          const posId = typeof contractToEdit.jobPosition === 'object' ? contractToEdit.jobPosition?._id : contractToEdit.jobPosition;
          const schedId = typeof contractToEdit.workingSchedule === 'object' ? contractToEdit.workingSchedule?._id : contractToEdit.workingSchedule;

          setFormData({
            contractNumber: contractToEdit.contractNumber || '',
            employee: empId || '',
            startDate: contractToEdit.startDate ? new Date(contractToEdit.startDate).toISOString().split('T')[0] : '',
            endDate: contractToEdit.endDate ? new Date(contractToEdit.endDate).toISOString().split('T')[0] : '',
            wage: contractToEdit.wage || 0,
            wageType: contractToEdit.wageType || 'Annual',
            salaryStructure: {
              basic: contractToEdit.salaryStructure?.basic || 0,
              allowances: {
                houseRent: contractToEdit.salaryStructure?.allowances?.houseRent || 0,
                transport: contractToEdit.salaryStructure?.allowances?.transport || 0,
                medical: contractToEdit.salaryStructure?.allowances?.medical || 0,
                other: contractToEdit.salaryStructure?.allowances?.other || 0,
              },
              deductions: {
                tax: contractToEdit.salaryStructure?.deductions?.tax || 0,
                providentFund: contractToEdit.salaryStructure?.deductions?.providentFund || 0,
                insurance: contractToEdit.salaryStructure?.deductions?.insurance || 0,
                other: contractToEdit.salaryStructure?.deductions?.other || 0,
              },
            },
            department: deptId || '',
            jobPosition: posId || '',
            workingSchedule: schedId || '',
            status: contractToEdit.status || 'Active',
            notes: contractToEdit.notes || '',
          });

          if (deptId) {
            const posRes = await positionApi.getAll(deptId);
            setPositions(posRes.data || []);
          }
        } else {
          // Generate default Contract Number
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          const autoCtr = `CTR-2026-${randomNum}`;

          let initEmpId = preselectedEmployee ? preselectedEmployee._id : '';
          let initDeptId = preselectedEmployee && typeof preselectedEmployee.department === 'object' ? preselectedEmployee.department._id : '';
          let initPosId = preselectedEmployee && typeof preselectedEmployee.jobPosition === 'object' ? preselectedEmployee.jobPosition._id : '';
          let initSchedId = preselectedEmployee && typeof preselectedEmployee.workingSchedule === 'object' ? preselectedEmployee.workingSchedule._id : '';

          setFormData((prev) => ({
            ...prev,
            contractNumber: autoCtr,
            employee: initEmpId || prev.employee,
            department: initDeptId || prev.department,
            jobPosition: initPosId || prev.jobPosition,
            workingSchedule: initSchedId || prev.workingSchedule,
          }));

          if (initDeptId) {
            const posRes = await positionApi.getAll(initDeptId);
            setPositions(posRes.data || []);
          }
        }
      } catch (err) {
        setApiError('Failed to load employee & department references');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadData();
  }, [isOpen, contractToEdit, preselectedEmployee]);

  // Handle employee selection -> auto-fill department, position, schedule
  const handleEmployeeChange = async (e) => {
    const empId = e.target.value;
    setFormData((prev) => ({ ...prev, employee: empId }));

    const selectedEmp = employees.find((emp) => emp._id === empId);
    if (selectedEmp) {
      const deptId = typeof selectedEmp.department === 'object' ? selectedEmp.department?._id : selectedEmp.department;
      const posId = typeof selectedEmp.jobPosition === 'object' ? selectedEmp.jobPosition?._id : selectedEmp.jobPosition;
      const schedId = typeof selectedEmp.workingSchedule === 'object' ? selectedEmp.workingSchedule?._id : selectedEmp.workingSchedule;

      setFormData((prev) => ({
        ...prev,
        department: deptId || prev.department,
        jobPosition: posId || prev.jobPosition,
        workingSchedule: schedId || prev.workingSchedule,
      }));

      if (deptId) {
        try {
          const posRes = await positionApi.getAll(deptId);
          setPositions(posRes.data || []);
        } catch {
          setPositions([]);
        }
      }
    }
  };

  const handleDepartmentChange = async (e) => {
    const deptId = e.target.value;
    setFormData((prev) => ({ ...prev, department: deptId, jobPosition: '' }));
    if (deptId) {
      try {
        const res = await positionApi.getAll(deptId);
        setPositions(res.data || []);
      } catch {
        setPositions([]);
      }
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.contractNumber.trim()) {
      errors.contractNumber = 'Contract number is required';
    }
    if (!formData.employee) {
      errors.employee = 'Employee selection is required';
    }
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      errors.endDate = 'End date cannot be earlier than start date';
    }
    if (!formData.wage || Number(formData.wage) <= 0) {
      errors.wage = 'Wage must be a positive number greater than 0';
    }
    if (!formData.salaryStructure.basic || Number(formData.salaryStructure.basic) < 0) {
      errors.basic = 'Basic salary cannot be negative';
    }
    if (!formData.department) {
      errors.department = 'Department is required';
    }
    if (!formData.jobPosition) {
      errors.jobPosition = 'Job position is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        wage: Number(formData.wage),
        endDate: formData.endDate ? formData.endDate : null,
        workingSchedule: formData.workingSchedule || null,
        salaryStructure: {
          basic: Number(formData.salaryStructure.basic),
          allowances: {
            houseRent: Number(formData.salaryStructure.allowances.houseRent || 0),
            transport: Number(formData.salaryStructure.allowances.transport || 0),
            medical: Number(formData.salaryStructure.allowances.medical || 0),
            other: Number(formData.salaryStructure.allowances.other || 0),
          },
          deductions: {
            tax: Number(formData.salaryStructure.deductions.tax || 0),
            providentFund: Number(formData.salaryStructure.deductions.providentFund || 0),
            insurance: Number(formData.salaryStructure.deductions.insurance || 0),
            other: Number(formData.salaryStructure.deductions.other || 0),
          },
        },
      };

      let result;
      if (isEditing) {
        result = await contractApi.update(contractToEdit._id, payload);
      } else {
        result = await contractApi.create(payload);
      }

      onSuccess(result.message || `Contract ${isEditing ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to save contract record');
      if (err.errors && Array.isArray(err.errors)) {
        const fieldErrs = {};
        err.errors.forEach((fe) => {
          fieldErrs[fe.field] = fe.message;
        });
        setFormErrors(fieldErrs);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Contract (${formData.contractNumber})` : 'Create Employment Contract'}
      maxWidth="max-w-4xl"
    >
      {loadingOptions ? (
        <div className="p-8 text-center flex items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600 mr-2" />
          Loading employees, departments, and positions...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {apiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Section 1: Basic Contract Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1">
              1. Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Contract Number *
                </label>
                <input
                  type="text"
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {formErrors.contractNumber && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.contractNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Employee *
                </label>
                <select
                  value={formData.employee}
                  onChange={handleEmployeeChange}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId})
                    </option>
                  ))}
                </select>
                {formErrors.employee && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.employee}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Expired">Expired</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {formErrors.startDate && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  End Date (Optional / Indefinite)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {formErrors.endDate && <p className="text-xs text-rose-600 mt-1">{formErrors.endDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Wage Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={formData.wage}
                  onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
                {formErrors.wage && <p className="text-xs text-rose-600 mt-1">{formErrors.wage}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Salary Structure Components */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1 flex items-center">
              <Calculator className="w-4 h-4 mr-1 text-brand-600" /> 2. Salary Structure Breakdown
            </h4>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Basic Salary (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salaryStructure.basic}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryStructure: { ...formData.salaryStructure, basic: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {formErrors.basic && <p className="text-xs text-rose-600 mt-1">{formErrors.basic}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-700 uppercase mb-1">
                  House Rent Allowance (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salaryStructure.allowances.houseRent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryStructure: {
                        ...formData.salaryStructure,
                        allowances: {
                          ...formData.salaryStructure.allowances,
                          houseRent: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-700 uppercase mb-1">
                  Transport Allowance (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salaryStructure.allowances.transport}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryStructure: {
                        ...formData.salaryStructure,
                        allowances: {
                          ...formData.salaryStructure.allowances,
                          transport: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-700 uppercase mb-1">
                  Medical Allowance (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salaryStructure.allowances.medical}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryStructure: {
                        ...formData.salaryStructure,
                        allowances: {
                          ...formData.salaryStructure.allowances,
                          medical: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-700 uppercase mb-1">
                  Tax Deduction (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salaryStructure.deductions.tax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryStructure: {
                        ...formData.salaryStructure,
                        deductions: {
                          ...formData.salaryStructure.deductions,
                          tax: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-700 uppercase mb-1">
                  Provident Fund (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.salaryStructure.deductions.providentFund}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salaryStructure: {
                        ...formData.salaryStructure,
                        deductions: {
                          ...formData.salaryStructure.deductions,
                          providentFund: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Department, Position, Schedule */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1">
              3. Organization & Schedule Assignment
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {formErrors.department && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.department}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Job Position *
                </label>
                <select
                  value={formData.jobPosition}
                  disabled={!formData.department}
                  onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
                >
                  <option value="">
                    {formData.department ? '-- Select Position --' : 'Select Department First'}
                  </option>
                  {positions.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {formErrors.jobPosition && (
                  <p className="text-xs text-rose-600 mt-1">{formErrors.jobPosition}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Working Schedule
                </label>
                <select
                  value={formData.workingSchedule}
                  onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Select Schedule --</option>
                  {schedules.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.weeklyHours}h)
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
              className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Contract Changes' : 'Create Contract'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
