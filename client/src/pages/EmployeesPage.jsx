import React, { useState, useEffect } from 'react';
import { employeeApi } from '../api/employeeApi';
import { departmentApi } from '../api/departmentApi';
import { positionApi } from '../api/positionApi';
import { EmployeeList } from '../components/employee/EmployeeList';
import { EmployeeKanban } from '../components/employee/EmployeeKanban';
import { EmployeeFormModal } from '../components/employee/EmployeeFormModal';
import { EmployeeDetails } from '../components/employee/EmployeeDetails';
import { ContractFormModal } from '../components/contract/ContractFormModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Plus, LayoutList, Kanban, ChevronLeft, ChevronRight } from 'lucide-react';

export const EmployeesPage = () => {
  const { canManageHR, isAdmin } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

  // Modals & States
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [contractEmployee, setContractEmployee] = useState(null);

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [error, setError] = useState(null);
  const [confirmDeleteEmp, setConfirmDeleteEmp] = useState(null);

  // Load initial dropdowns
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [dRes, pRes] = await Promise.all([departmentApi.getAll(), positionApi.getAll()]);
        setDepartments(dRes.data || []);
        setPositions(pRes.data || []);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    loadLookups();
  }, []);

  // Fetch Employees when search/filters/page change
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: search.trim() || undefined,
        department: deptFilter || undefined,
        jobPosition: posFilter || undefined,
        employeeType: typeFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      };

      const res = await employeeApi.getAll(params);
      setEmployees(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch employee data');
      setToast({ message: err.message || 'Failed to fetch employee data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedEmployeeId) {
      fetchEmployees();
    }
  }, [search, deptFilter, posFilter, typeFilter, statusFilter, page, selectedEmployeeId]);

  const handleCreateNew = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setIsFormOpen(true);
  };

  const handleDelete = (emp) => {
    setConfirmDeleteEmp(emp);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteEmp) return;
    try {
      await employeeApi.delete(confirmDeleteEmp._id);
      setToast({ message: `Employee ${confirmDeleteEmp.name} terminated successfully`, type: 'success' });
      setConfirmDeleteEmp(null);
      fetchEmployees();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete employee', type: 'error' });
      setConfirmDeleteEmp(null);
    }
  };

  const handleFormSuccess = (msg) => {
    setToast({ message: msg, type: 'success' });
    fetchEmployees();
  };

  const handleCreateContractForEmp = (emp) => {
    setContractEmployee(emp);
    setIsContractFormOpen(true);
  };

  if (selectedEmployeeId) {
    return (
      <div className="p-2">
        <EmployeeDetails
          employeeId={selectedEmployeeId}
          onBack={() => setSelectedEmployeeId(null)}
          onEdit={(emp) => handleEdit(emp)}
          onCreateContractForEmployee={(emp) => handleCreateContractForEmp(emp)}
        />

        {/* Edit Modal */}
        <EmployeeFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          employeeToEdit={editingEmployee}
          onSuccess={handleFormSuccess}
        />

        {/* Contract Modal */}
        <ContractFormModal
          isOpen={isContractFormOpen}
          onClose={() => setIsContractFormOpen(false)}
          preselectedEmployee={contractEmployee}
          onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
        />

        {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <PageHeader
        title="Employee Management"
        subtitle="View, search, filter, and manage staff records & profiles."
        breadcrumbs={[
          { label: 'Overview', href: '/' },
          { label: 'Employees' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            {/* View toggle */}
            <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center space-x-1 shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center transition ${
                  viewMode === 'table' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutList className="w-4 h-4 mr-1" /> Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center transition ${
                  viewMode === 'kanban' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Kanban className="w-4 h-4 mr-1" /> Kanban
              </button>
            </div>

            {canManageHR && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Employee
              </button>
            )}
          </div>
        }
      />

      {/* Error Message with Retry */}
      {error && (
        <ErrorMessage
          title="Failed to Load Employees"
          message={error}
          onRetry={fetchEmployees}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, or employeeId..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Types</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Probation">Probation</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner label="Loading employee directory..." />
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="No employee records match your search or filter parameters."
          actionLabel={canManageHR ? 'Add New Employee' : null}
          onAction={handleCreateNew}
        />
      ) : viewMode === 'table' ? (
        <div className="space-y-4">
          <EmployeeList
            employees={employees}
            onSelectEmployee={(emp) => setSelectedEmployeeId(emp._id)}
            onEditEmployee={(emp) => handleEdit(emp)}
            onDeleteEmployee={(emp) => handleDelete(emp)}
          />

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500">
                Page <span className="font-semibold text-gray-900">{page}</span> of{' '}
                <span className="font-semibold text-gray-900">{meta.totalPages}</span> ({meta.total} total)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmployeeKanban
          employees={employees}
          departments={departments}
          onSelectEmployee={(emp) => setSelectedEmployeeId(emp._id)}
          onEditEmployee={(emp) => handleEdit(emp)}
        />
      )}

      {/* Modals */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employeeToEdit={editingEmployee}
        onSuccess={handleFormSuccess}
      />

      <ContractFormModal
        isOpen={isContractFormOpen}
        onClose={() => setIsContractFormOpen(false)}
        preselectedEmployee={contractEmployee}
        onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteEmp}
        onClose={() => setConfirmDeleteEmp(null)}
        onConfirm={handleConfirmDelete}
        title="Terminate Employee"
        message={`Are you sure you want to terminate/delete the employee record for "${confirmDeleteEmp?.name}"? This action cannot be undone.`}
        confirmText="Terminate Employee"
        variant="danger"
      />

      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}
    </div>
  );
};
