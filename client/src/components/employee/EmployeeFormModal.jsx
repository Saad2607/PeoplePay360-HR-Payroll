import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { employeeApi } from '../../api/employeeApi';
import { departmentApi } from '../../api/departmentApi';
import { positionApi } from '../../api/positionApi';
import { scheduleApi } from '../../api/scheduleApi';
import { Loader2, AlertCircle } from 'lucide-react';

export const EmployeeFormModal = ({ isOpen, onClose, employeeToEdit = null, onSuccess }) => {
  const isEditing = !!employeeToEdit;

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    jobPosition: '',
    manager: '',
    workingSchedule: '',
    employeeType: 'Full-Time',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'Active',
  });

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Load dropdown data
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoadingOptions(true);
      try {
        const [deptRes, mgrRes, schedRes] = await Promise.all([
          departmentApi.getAll(),
          employeeApi.getAll({ limit: 100 }),
          scheduleApi.getAll(),
        ]);

        setDepartments(deptRes.data || []);
        setManagers(mgrRes.data || []);
        setSchedules(schedRes.data || []);

        if (employeeToEdit) {
          const deptId = typeof employeeToEdit.department === 'object' ? employeeToEdit.department?._id : employeeToEdit.department;
          const posId = typeof employeeToEdit.jobPosition === 'object' ? employeeToEdit.jobPosition?._id : employeeToEdit.jobPosition;
          const mgrId = typeof employeeToEdit.manager === 'object' ? employeeToEdit.manager?._id : employeeToEdit.manager;
          const schedId = typeof employeeToEdit.workingSchedule === 'object' ? employeeToEdit.workingSchedule?._id : employeeToEdit.workingSchedule;

          setFormData({
            employeeId: employeeToEdit.employeeId || '',
            name: employeeToEdit.name || '',
            email: employeeToEdit.email || '',
            phone: employeeToEdit.phone || '',
            department: deptId || '',
            jobPosition: posId || '',
            manager: mgrId || '',
            workingSchedule: schedId || '',
            employeeType: employeeToEdit.employeeType || 'Full-Time',
            joiningDate: employeeToEdit.joiningDate ? new Date(employeeToEdit.joiningDate).toISOString().split('T')[0] : '',
            status: employeeToEdit.status || 'Active',
          });

          if (deptId) {
            const posRes = await positionApi.getAll(deptId);
            setPositions(posRes.data || []);
          }
        }
      } catch (err) {
        setApiError('Failed to load lookup data');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadData();
  }, [isOpen, employeeToEdit]);

  // Handle department change -> fetch matching positions
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
    } else {
      setPositions([]);
    }
  };

  const validate = () => {
    const errors = {};
    if (!isEditing && !formData.employeeId.trim()) {
      errors.employeeId = 'Employee ID is required (e.g. EMP010)';
    }
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    if (!formData.department) {
      errors.department = 'Department selection is required';
    }
    if (!formData.jobPosition) {
      errors.jobPosition = 'Job Position selection is required';
    }
    if (!formData.workingSchedule) {
      errors.workingSchedule = 'Working Schedule selection is required';
    }

    if (isEditing && formData.manager && formData.manager === employeeToEdit?._id) {
      errors.manager = 'An employee cannot be assigned as their own manager';
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
        manager: formData.manager || null,
      };

      let result;
      if (isEditing) {
        // Do not include employeeId on update if disabled
        const { employeeId, ...updatePayload } = payload;
        result = await employeeApi.update(employeeToEdit._id, updatePayload);
      } else {
        result = await employeeApi.create(payload);
      }

      onSuccess(result.message || `Employee ${isEditing ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to save employee record');
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
      title={isEditing ? `Edit Employee (${formData.employeeId})` : 'Add New Employee'}
      maxWidth="max-w-3xl"
    >
      {loadingOptions ? (
        <div className="p-8 text-center flex items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600 mr-2" />
          Loading departments, positions, and schedules...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {apiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                disabled={isEditing}
                placeholder="e.g. EMP010"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                  isEditing ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'focus:ring-brand-500 border-gray-300'
                }`}
              />
              {formErrors.employeeId && (
                <p className="text-xs text-rose-600 mt-1">{formErrors.employeeId}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Kavita Rao"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g. kavita.rao@peoplepay360.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {formErrors.email && <p className="text-xs text-rose-600 mt-1">{formErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                placeholder="e.g. +1 (555) 234-9988"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {formErrors.phone && <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>}
            </div>

            {/* Department */}
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
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              {formErrors.department && (
                <p className="text-xs text-rose-600 mt-1">{formErrors.department}</p>
              )}
            </div>

            {/* Job Position */}
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
                  {formData.department ? '-- Select Job Position --' : 'Select Department First'}
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

            {/* Working Schedule */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Working Schedule *
              </label>
              <select
                value={formData.workingSchedule}
                onChange={(e) => setFormData({ ...formData, workingSchedule: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Select Working Schedule --</option>
                {schedules.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.weeklyHours} hrs/week)
                  </option>
                ))}
              </select>
              {formErrors.workingSchedule && (
                <p className="text-xs text-rose-600 mt-1">{formErrors.workingSchedule}</p>
              )}
            </div>

            {/* Manager */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Reporting Manager (Optional)
              </label>
              <select
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- None (Top Level) --</option>
                {managers
                  .filter((m) => !isEditing || m._id !== employeeToEdit?._id)
                  .map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.employeeId})
                    </option>
                  ))}
              </select>
              {formErrors.manager && <p className="text-xs text-rose-600 mt-1">{formErrors.manager}</p>}
            </div>

            {/* Employee Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Employee Type
              </label>
              <select
                value={formData.employeeType}
                onChange={(e) => setFormData({ ...formData, employeeType: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            {/* Status */}
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
                <option value="Probation">Probation</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Joining Date
              </label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
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
              {isEditing ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
