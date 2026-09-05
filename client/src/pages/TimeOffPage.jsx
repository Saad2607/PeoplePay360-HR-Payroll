import React, { useState, useEffect } from 'react';
import { timeOffRequestApi } from '../api/timeOffRequestApi';
import { allocationApi } from '../api/allocationApi';
import { timeOffTypeApi } from '../api/timeOffTypeApi';
import { TimeOffRequestList } from '../components/timeoff/TimeOffRequestList';
import { TimeOffRequestFormModal } from '../components/timeoff/TimeOffRequestFormModal';
import { ApprovalActionModal } from '../components/timeoff/ApprovalActionModal';
import { AllocationList } from '../components/timeoff/AllocationList';
import { AllocationFormModal } from '../components/timeoff/AllocationFormModal';
import { TimeOffTypeList } from '../components/timeoff/TimeOffTypeList';
import { TimeOffTypeFormModal } from '../components/timeoff/TimeOffTypeFormModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const TimeOffPage = () => {
  const { isHRManager, user } = useAuth();

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'allocations' | 'types'

  // Data states
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [balances, setBalances] = useState([]);
  const [types, setTypes] = useState([]);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });

  const [loading, setLoading] = useState(true);

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalAction, setApprovalAction] = useState('approve');

  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Fetch Requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await timeOffRequestApi.getAll({
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      setRequests(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch leave requests', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Allocations & Balances
  const fetchAllocationsAndBalances = async () => {
    setLoading(true);
    try {
      const [allocRes, balRes] = await Promise.all([
        allocationApi.getAll(),
        user?.employee?._id
          ? allocationApi.getEmployeeBalance(user.employee._id)
          : Promise.resolve({ data: [] }),
      ]);
      setAllocations(allocRes.data || []);
      setBalances(balRes.data || []);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch leave allocations', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Time Off Types
  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await timeOffTypeApi.getAll();
      setTypes(res.data || []);
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch time off types', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'requests') fetchRequests();
    else if (activeTab === 'allocations') fetchAllocationsAndBalances();
    else if (activeTab === 'types') fetchTypes();
  }, [activeTab, statusFilter, page]);

  const handleApproveTrigger = (req) => {
    setSelectedRequest(req);
    setApprovalAction('approve');
    setIsApprovalModalOpen(true);
  };

  const handleRefuseTrigger = (req) => {
    setSelectedRequest(req);
    setApprovalAction('refuse');
    setIsApprovalModalOpen(true);
  };

  const handleCancelRequest = async (req) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      try {
        await timeOffRequestApi.cancel(req._id);
        setToast({ message: 'Request cancelled successfully', type: 'success' });
        fetchRequests();
      } catch (err) {
        setToast({ message: err.message || 'Failed to cancel request', type: 'error' });
      }
    }
  };

  const handleDeleteType = async (type) => {
    if (window.confirm(`Are you sure you want to delete time off type "${type.name}"?`)) {
      try {
        await timeOffTypeApi.delete(type._id);
        setToast({ message: `Time off type ${type.name} deleted`, type: 'success' });
        fetchTypes();
      } catch (err) {
        setToast({ message: err.message || 'Failed to delete time off type', type: 'error' });
      }
    }
  };

  const handleSuccessToast = (msg) => {
    setToast({ message: msg, type: 'success' });
    if (activeTab === 'requests') fetchRequests();
    else if (activeTab === 'allocations') fetchAllocationsAndBalances();
    else if (activeTab === 'types') fetchTypes();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Time Off & Leave Management</h1>
          <p className="text-sm text-gray-500">
            Submit leave requests, review HR approval workflows, track allocations & balance rules.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'requests' && (
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Submit Request
            </button>
          )}

          {activeTab === 'allocations' && isHRManager && (
            <button
              onClick={() => setIsAllocationModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Grant Allocation
            </button>
          )}

          {activeTab === 'types' && isHRManager && (
            <button
              onClick={() => {
                setEditingType(null);
                setIsTypeModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Leave Type
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-6 rounded-xl border">
        <nav className="flex space-x-8 text-sm font-medium">
          <button
            onClick={() => {
              setActiveTab('requests');
              setPage(1);
            }}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'requests'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" /> Leave Requests
          </button>

          <button
            onClick={() => setActiveTab('allocations')}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'allocations'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4 mr-2" /> Allocations & Balances
          </button>

          <button
            onClick={() => setActiveTab('types')}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'types'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" /> Time Off Types
          </button>
        </nav>
      </div>

      {/* Requests Tab Content */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-gray-500 font-semibold">Status Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">All Statuses (Pending, Approved, Refused)</option>
                <option value="Pending">Pending Approvals</option>
                <option value="Approved">Approved</option>
                <option value="Refused">Refused</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading time off requests..." />
          ) : requests.length === 0 ? (
            <EmptyState
              title="No leave requests found"
              description="There are no requests matching your criteria."
              actionLabel="Submit Leave Request"
              onAction={() => setIsRequestModalOpen(true)}
              icon={Calendar}
            />
          ) : (
            <div className="space-y-4">
              <TimeOffRequestList
                requests={requests}
                onApprove={handleApproveTrigger}
                onRefuse={handleRefuseTrigger}
                onCancel={handleCancelRequest}
              />

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
        </div>
      )}

      {/* Allocations Tab Content */}
      {activeTab === 'allocations' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner label="Loading leave allocations & balances..." />
          ) : allocations.length === 0 ? (
            <EmptyState
              title="No leave allocations"
              description="No allocations granted yet."
              actionLabel={isHRManager ? 'Grant Allocation' : null}
              onAction={() => setIsAllocationModalOpen(true)}
              icon={Layers}
            />
          ) : (
            <AllocationList allocations={allocations} balances={balances} />
          )}
        </div>
      )}

      {/* Types Tab Content */}
      {activeTab === 'types' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner label="Loading time off types..." />
          ) : types.length === 0 ? (
            <EmptyState
              title="No time off types configured"
              description="Create leave types such as Paid Time Off, Sick Leave, or Unpaid Leave."
              actionLabel={isHRManager ? 'Add Leave Type' : null}
              onAction={() => {
                setEditingType(null);
                setIsTypeModalOpen(true);
              }}
              icon={Clock}
            />
          ) : (
            <TimeOffTypeList
              timeOffTypes={types}
              onEditType={(t) => {
                setEditingType(t);
                setIsTypeModalOpen(true);
              }}
              onDeleteType={handleDeleteType}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <TimeOffRequestFormModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={handleSuccessToast}
      />

      <ApprovalActionModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        request={selectedRequest}
        actionType={approvalAction}
        onSuccess={handleSuccessToast}
      />

      <AllocationFormModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        onSuccess={handleSuccessToast}
      />

      <TimeOffTypeFormModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        typeToEdit={editingType}
        onSuccess={handleSuccessToast}
      />

      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}
    </div>
  );
};
