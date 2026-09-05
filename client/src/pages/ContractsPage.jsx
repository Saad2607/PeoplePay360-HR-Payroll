import React, { useState, useEffect } from 'react';
import { contractApi } from '../api/contractApi';
import { departmentApi } from '../api/departmentApi';
import { employeeApi } from '../api/employeeApi';
import { scheduleApi } from '../api/scheduleApi';
import { ContractList } from '../components/contract/ContractList';
import { ContractFormModal } from '../components/contract/ContractFormModal';
import { ContractDetailsModal } from '../components/contract/ContractDetailsModal';
import { ScheduleList } from '../components/contract/ScheduleList';
import { ScheduleFormModal } from '../components/contract/ScheduleFormModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import { Plus, FileText, Filter, Search, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export const ContractsPage = () => {
  const { canManageHR, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts' | 'schedules'

  const [contracts, setContracts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);

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

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [confirmDeleteSchedule, setConfirmDeleteSchedule] = useState(null);

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

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await scheduleApi.getAll();
      setSchedules(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch working schedules');
      setToast({ message: err.message || 'Failed to fetch working schedules', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'contracts') {
      fetchContracts();
    } else {
      fetchSchedules();
    }
  }, [activeTab, statusFilter, deptFilter, empFilter, page]);

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

  // Schedule Handlers
  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (sch) => {
    setEditingSchedule(sch);
    setIsScheduleModalOpen(true);
  };

  const handleDeleteSchedule = (sch) => {
    setConfirmDeleteSchedule(sch);
  };

  const handleConfirmDeleteSchedule = async () => {
    if (!confirmDeleteSchedule) return;
    try {
      await scheduleApi.delete(confirmDeleteSchedule._id);
      setToast({ message: `Schedule "${confirmDeleteSchedule.name}" deleted successfully`, type: 'success' });
      setConfirmDeleteSchedule(null);
      fetchSchedules();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete schedule', type: 'error' });
      setConfirmDeleteSchedule(null);
    }
  };

  const handleScheduleFormSuccess = (msg) => {
    setToast({ message: msg, type: 'success' });
    fetchSchedules();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <PageHeader
        title={activeTab === 'contracts' ? 'Contract Management' : 'Working Schedules Setup'}
        subtitle={
          activeTab === 'contracts'
            ? 'Manage wage structures, salary breakdown components, and period-specific active contracts.'
            : 'Define weekly work patterns, day schedules, and break durations with auto-calculated weekly hours.'
        }
        breadcrumbs={[
          { label: 'Overview', href: '/' },
          { label: 'Contracts & Schedules' },
        ]}
        actions={
          canManageHR && (
            <button
              onClick={activeTab === 'contracts' ? handleCreateNew : handleCreateSchedule}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {activeTab === 'contracts' ? 'Create Contract' : 'Create Working Schedule'}
            </button>
          )
        }
      />

      {/* Tabs Switcher: Contracts vs Working Schedules (PDF Requirement A3) */}
      <div className="border-b border-gray-200 bg-white px-4 sm:px-6 rounded-xl border overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-8 text-sm font-medium whitespace-nowrap min-w-max">
          <button
            onClick={() => {
              setActiveTab('contracts');
              setPage(1);
            }}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'contracts'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" /> Employment Contracts
          </button>
          <button
            onClick={() => {
              setActiveTab('schedules');
              setPage(1);
            }}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'schedules'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" /> Working Schedules Setup ({schedules.length})
          </button>
        </nav>
      </div>

      {/* Error Message with Retry */}
      {error && (
        <ErrorMessage
          title="Failed to Load Data"
          message={error}
          onRetry={activeTab === 'contracts' ? fetchContracts : fetchSchedules}
          onDismiss={() => setError(null)}
        />
      )}

      {/* CONTRACTS TAB */}
      {activeTab === 'contracts' && (
        <>
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
              actionLabel={canManageHR ? 'Create New Contract' : null}
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
        </>
      )}

      {/* SCHEDULES TAB (PDF Requirement A3) */}
      {activeTab === 'schedules' && (
        <>
          {loading ? (
            <LoadingSpinner label="Loading working schedules..." />
          ) : schedules.length === 0 ? (
            <EmptyState
              title="No working schedules configured"
              description="Define working schedules to standardize attendance tracking and payroll expectations."
              actionLabel={canManageHR ? 'Create Working Schedule' : null}
              onAction={handleCreateSchedule}
              icon={Clock}
            />
          ) : (
            <ScheduleList
              schedules={schedules}
              onEditSchedule={handleEditSchedule}
              onDeleteSchedule={handleDeleteSchedule}
            />
          )}
        </>
      )}

      {/* Contract Form Modal */}
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

      {/* Schedule Form Modal (PDF Requirement A3) */}
      <ScheduleFormModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        scheduleToEdit={editingSchedule}
        onSuccess={handleScheduleFormSuccess}
      />

      {/* Confirm Delete Contract */}
      <ConfirmDialog
        isOpen={!!confirmDeleteContract}
        onClose={() => setConfirmDeleteContract(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Contract"
        message={`Are you sure you want to delete contract "${confirmDeleteContract?.contractNumber}"? This action cannot be undone.`}
        confirmText="Delete Contract"
        variant="danger"
      />

      {/* Confirm Delete Schedule */}
      <ConfirmDialog
        isOpen={!!confirmDeleteSchedule}
        onClose={() => setConfirmDeleteSchedule(null)}
        onConfirm={handleConfirmDeleteSchedule}
        title="Delete Working Schedule"
        message={`Are you sure you want to delete schedule "${confirmDeleteSchedule?.name}"? This action cannot be undone.`}
        confirmText="Delete Schedule"
        variant="danger"
      />

      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}
    </div>
  );
};

