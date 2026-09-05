import React, { useState, useEffect } from 'react';
import { contractApi } from '../api/contractApi';
import { departmentApi } from '../api/departmentApi';
import { employeeApi } from '../api/employeeApi';
import { ContractList } from '../components/contract/ContractList';
import { ContractFormModal } from '../components/contract/ContractFormModal';
import { ContractDetailsModal } from '../components/contract/ContractDetailsModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import { Plus, FileText, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const ContractsPage = () => {
  const { isHRManager, isAdmin } = useAuth();

  const [contracts, setContracts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

  // Modals & state
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [error, setError] = useState(null);
  const [confirmDeleteContract, setConfirmDeleteContract] = useState(null);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [dRes, eRes] = await Promise.all([
          departmentApi.getAll(),
          employeeApi.getAll({ limit: 100 }),
        ]);
        setDepartments(dRes.data || []);
        setEmployees(eRes.data || []);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    loadLookups();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: statusFilter || undefined,
        department: deptFilter || undefined,
        employee: empFilter || undefined,
        page,
        limit: 10,
      };

      const res = await contractApi.getAll(params);
      setContracts(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch contracts');
      setToast({ message: err.message || 'Failed to fetch contracts', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [statusFilter, deptFilter, empFilter, page]);

  const handleCreateNew = () => {
    setEditingContract(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ctr) => {
    setEditingContract(ctr);
    setIsFormOpen(true);
  };

  const handleDelete = (ctr) => {
    setConfirmDeleteContract(ctr);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteContract) return;
    try {
      await contractApi.delete(confirmDeleteContract._id);
      setToast({ message: `Contract ${confirmDeleteContract.contractNumber} deleted`, type: 'success' });
      setConfirmDeleteContract(null);
      fetchContracts();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete contract', type: 'error' });
      setConfirmDeleteContract(null);
    }
  };

  const handleFormSuccess = (msg) => {
    setToast({ message: msg, type: 'success' });
    fetchContracts();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <PageHeader
        title="Contract Management"
        subtitle="Manage wage structures, salary breakdown components, and period-specific active contracts."
        breadcrumbs={[
          { label: 'Overview', href: '/' },
          { label: 'Contracts' },
        ]}
        actions={
          isHRManager && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Create Contract
            </button>
          )
        }
      />

      {/* Error Message with Retry */}
      {error && (
        <ErrorMessage
          title="Failed to Load Contracts"
          message={error}
          onRetry={fetchContracts}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses (Active, Draft, Expired)</option>
              <option value="Active">Active Only</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
              Filter by Department
            </label>
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

          {/* Employee Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
              Filter by Employee
            </label>
            <select
              value={empFilter}
              onChange={(e) => {
                setEmpFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner label="Loading contracts..." />
      ) : contracts.length === 0 ? (
        <EmptyState
          title="No contracts found"
          description="There are no employment contracts matching your criteria."
          actionLabel={isHRManager ? 'Create New Contract' : null}
          onAction={handleCreateNew}
          icon={FileText}
        />
      ) : (
        <div className="space-y-4">
          <ContractList
            contracts={contracts}
            onSelectContract={(ctr) => setSelectedContract(ctr)}
            onEditContract={(ctr) => handleEdit(ctr)}
            onDeleteContract={(ctr) => handleDelete(ctr)}
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
      )}

      {/* Form Modal */}
      <ContractFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        contractToEdit={editingContract}
        onSuccess={handleFormSuccess}
      />

      {/* Details Modal */}
      <ContractDetailsModal
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        contract={selectedContract}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteContract}
        onClose={() => setConfirmDeleteContract(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Contract"
        message={`Are you sure you want to delete contract "${confirmDeleteContract?.contractNumber}"? This action cannot be undone.`}
        confirmText="Delete Contract"
        variant="danger"
      />

      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}
    </div>
  );
};
