import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { payrunApi } from '../api/payrunApi';
import { payslipApi } from '../api/payslipApi';
import { salaryStructureApi } from '../api/salaryStructureApi';
import { salaryRuleApi } from '../api/salaryRuleApi';
import { PayrunList } from '../components/payroll/PayrunList';
import { PayrunWizardModal } from '../components/payroll/PayrunWizardModal';
import { PayrunDetails } from '../components/payroll/PayrunDetails';
import { PayslipList } from '../components/payroll/PayslipList';
import { PayslipDetailsModal } from '../components/payroll/PayslipDetailsModal';
import { SalaryStructureList } from '../components/payroll/SalaryStructureList';
import { SalaryStructureFormModal } from '../components/payroll/SalaryStructureFormModal';
import { SalaryRuleList } from '../components/payroll/SalaryRuleList';
import { SalaryRuleFormModal } from '../components/payroll/SalaryRuleFormModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { PageHeader } from '../components/common/PageHeader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import {
  IndianRupee,
  Plus,
  PlayCircle,
  FileText,
  Layers,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
  Users,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export const PayrollPage = () => {
  const { isEmployee, isHRManager, isPayrollUser, isPayrollManager, isAdmin, canExecutePayroll, canManageSalaryRules } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlTab = searchParams.get('tab');
  const initialTab = ['payruns', 'payslips', 'structures'].includes(urlTab) ? urlTab : 'payruns';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab state whenever URL query params change (e.g. from sidebar clicks)
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && ['payruns', 'payslips', 'structures'].includes(currentTab)) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);

  const [selectedPayrunId, setSelectedPayrunId] = useState(null);
  const [selectedPayslipId, setSelectedPayslipId] = useState(null);

  // Data states
  const [payruns, setPayruns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [structures, setStructures] = useState([]);
  const [rules, setRules] = useState([]);
  const [structureSubTab, setStructureSubTab] = useState('structures'); // 'structures' | 'rules'

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Fetch Payruns
  const fetchPayruns = async () => {
    if (!canExecutePayroll && !isHRManager) return;
    setLoading(true);
    setError(null);
    try {
      const res = await payrunApi.getAll({ page, limit: 10 });
      setPayruns(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to load payruns');
      setToast({ message: err.message || 'Failed to load payruns', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Payslips (works for both employee self-service and payroll managers)
  const fetchPayslips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payslipApi.getAll({ page, limit: 10 });
      setPayslips(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to load payslips');
      setToast({ message: err.message || 'Failed to load payslips', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Structures & Sequenced Rules
  const fetchStructures = async () => {
    if (!canExecutePayroll && !isHRManager) return;
    setLoading(true);
    setError(null);
    try {
      const [stRes, ruRes] = await Promise.all([
        salaryStructureApi.getAll(),
        salaryRuleApi.getAll().catch(() => ({ data: [] })),
      ]);
      setStructures(stRes.data || []);
      setRules(ruRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load salary structures & rules');
      setToast({ message: err.message || 'Failed to load salary structures & rules', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEmployee) {
      fetchPayslips();
      return;
    }

    if (!selectedPayrunId) {
      if (activeTab === 'payruns') fetchPayruns();
      else if (activeTab === 'payslips') fetchPayslips();
      else if (activeTab === 'structures') fetchStructures();
    }
  }, [activeTab, page, selectedPayrunId, isEmployee, canExecutePayroll, isHRManager]);

  const handleDeletePayrun = (run) => {
    setConfirmDelete({
      type: 'payrun',
      data: run,
      title: 'Delete Draft Payrun',
      message: `Are you sure you want to delete Draft payrun "${run.name}"? This action cannot be undone.`,
      confirmText: 'Delete Payrun',
      variant: 'danger',
    });
  };

  const handleDeleteStructure = (s) => {
    setConfirmDelete({
      type: 'structure',
      data: s,
      title: 'Delete Salary Structure',
      message: `Are you sure you want to delete salary structure "${s.name}"? This action cannot be undone.`,
      confirmText: 'Delete Structure',
      variant: 'danger',
    });
  };

  const handleDeleteRule = (r) => {
    setConfirmDelete({
      type: 'rule',
      data: r,
      title: 'Delete Salary Rule',
      message: `Are you sure you want to delete salary rule "${r.name}" (${r.code})? This action cannot be undone.`,
      confirmText: 'Delete Rule',
      variant: 'danger',
    });
  };

  const handleEditRule = (r) => {
    setEditingRule(r);
    setIsRuleModalOpen(true);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsRuleModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'payrun') {
        await payrunApi.delete(confirmDelete.data._id);
        setToast({ message: 'Draft payrun deleted successfully', type: 'success' });
        setConfirmDelete(null);
        fetchPayruns();
      } else if (confirmDelete.type === 'structure') {
        await salaryStructureApi.delete(confirmDelete.data._id);
        setToast({ message: `Salary structure ${confirmDelete.data.name} deleted`, type: 'success' });
        setConfirmDelete(null);
        fetchStructures();
      } else if (confirmDelete.type === 'rule') {
        await salaryRuleApi.delete(confirmDelete.data._id);
        setToast({ message: `Salary rule ${confirmDelete.data.name} deleted`, type: 'success' });
        setConfirmDelete(null);
        fetchStructures();
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete record', type: 'error' });
      setConfirmDelete(null);
    }
  };

  const handleSuccessToast = (msg) => {
    setToast({ message: msg, type: 'success' });
    if (activeTab === 'payruns') fetchPayruns();
    else if (activeTab === 'payslips') fetchPayslips();
    else if (activeTab === 'structures') fetchStructures();
  };

  // 2. Employee Persona — Self-Service Payslips History
  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center">
              <IndianRupee className="w-7 h-7 text-emerald-600 mr-2" />
              My Payslips & Compensation History
            </h1>
            <p className="text-sm text-gray-500">
              Access issued paystubs, review gross-to-net deductions breakdown, and download printable vector PDF slips.
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading your payslips history..." />
        ) : payslips.length === 0 ? (
          <EmptyState
            title="No payslips issued yet"
            description="Your payslips will appear here once payroll processing for your pay cycle is completed."
            icon={FileText}
          />
        ) : (
          <div className="space-y-4">
            <PayslipList
              payslips={payslips}
              onViewDetails={(id) => setSelectedPayslipId(id)}
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

        <PayslipDetailsModal
          isOpen={!!selectedPayslipId}
          onClose={() => setSelectedPayslipId(null)}
          payslipId={selectedPayslipId}
        />
      </div>
    );
  }

  // 3. Payroll Administrators Persona (HR Payroll User, HR Payroll Manager, Admin)
  if (selectedPayrunId) {
    return (
      <div className="p-2">
        <PayrunDetails
          payrunId={selectedPayrunId}
          onBack={() => setSelectedPayrunId(null)}
          onViewPayslip={(psId) => setSelectedPayslipId(psId)}
        />

        <PayslipDetailsModal
          isOpen={!!selectedPayslipId}
          onClose={() => setSelectedPayslipId(null)}
          payslipId={selectedPayslipId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <PageHeader
        title="Payroll Management Engine"
        subtitle="Process payruns, compute salary rules, generate payslips, and stream vector PDFs."
        breadcrumbs={[
          { label: 'Overview', href: '/' },
          { label: 'Payroll' },
        ]}
        actions={
          <div className="flex items-center space-x-3">
            {activeTab === 'payruns' && canExecutePayroll && (
              <button
                onClick={() => setIsWizardOpen(true)}
                className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
              >
                <Plus className="w-4 h-4 mr-1.5" /> New Payrun Wizard
              </button>
            )}

            {activeTab === 'structures' && canManageSalaryRules && (
              structureSubTab === 'structures' ? (
                <button
                  onClick={() => {
                    setEditingStructure(null);
                    setIsStructureModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Salary Structure
                </button>
              ) : (
                <button
                  onClick={handleCreateRule}
                  className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Salary Rule
                </button>
              )
            )}
          </div>
        }
      />

      {/* Auditor Notice for HR Managers */}
      {isHRManager && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 text-xs shadow-xs">
          <div className="flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Auditor Mode (HR Manager):</span> You have read-only access to audit payruns, inspect itemized payslips, and download statement PDFs. Execution (Drafting, Computing, Approving, and Disbursing) is reserved for Payroll Users & Managers.
            </div>
          </div>
        </div>
      )}

      {/* Error Message with Retry */}
      {error && (
        <ErrorMessage
          title="Payroll Module Notice"
          message={error}
          onRetry={activeTab === 'payruns' ? fetchPayruns : activeTab === 'payslips' ? fetchPayslips : fetchStructures}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 bg-white px-4 sm:px-6 rounded-xl border overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-8 text-sm font-medium whitespace-nowrap min-w-max">
          <button
            onClick={() => {
              setActiveTab('payruns');
              setSearchParams({ tab: 'payruns' });
              setPage(1);
            }}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'payruns'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PlayCircle className="w-4 h-4 mr-2" /> Payruns Engine
          </button>

          <button
            onClick={() => {
              setActiveTab('payslips');
              setSearchParams({ tab: 'payslips' });
              setPage(1);
            }}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'payslips'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" /> Payslips & PDF Generator
          </button>

          <button
            onClick={() => {
              setActiveTab('structures');
              setSearchParams({ tab: 'structures' });
              setPage(1);
            }}
            className={`py-4 border-b-2 transition flex items-center ${
              activeTab === 'structures'
                ? 'border-brand-600 text-brand-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4 mr-2" /> Salary Structures & Rules
          </button>
        </nav>
      </div>

      {/* Payruns Tab Content */}
      {activeTab === 'payruns' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner label="Loading payruns..." />
          ) : payruns.length === 0 ? (
            <EmptyState
              title="No payruns found"
              description="Start a new payrun wizard to select salary structures, eligible staff, and compute payslips."
              actionLabel={canExecutePayroll ? 'Launch New Payrun Wizard' : null}
              onAction={() => setIsWizardOpen(true)}
              icon={PlayCircle}
            />
          ) : (
            <div className="space-y-4">
              <PayrunList
                payruns={payruns}
                onSelectPayrun={(run) => setSelectedPayrunId(run._id)}
                onDeletePayrun={handleDeletePayrun}
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

      {/* Payslips Tab Content */}
      {activeTab === 'payslips' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner label="Loading payslip directory..." />
          ) : payslips.length === 0 ? (
            <EmptyState
              title="No payslips generated"
              description="Payslips will appear here once payruns are computed."
              icon={FileText}
            />
          ) : (
            <div className="space-y-4">
              <PayslipList
                payslips={payslips}
                onViewDetails={(id) => setSelectedPayslipId(id)}
                onError={(msg) => setToast({ message: msg, type: 'error' })}
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

      {/* Salary Structures & Rules Tab Content (PDF Requirement A5 & A6) */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          {/* Sub-tab Navigation */}
          <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setStructureSubTab('structures')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center ${
                structureSubTab === 'structures'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Layers className="w-4 h-4 mr-1.5" />
              Salary Structures ({structures.length})
            </button>
            <button
              onClick={() => setStructureSubTab('rules')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center ${
                structureSubTab === 'rules'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Sliders className="w-4 h-4 mr-1.5" />
              Salary Rules ({rules.length})
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading compensation settings..." />
          ) : structureSubTab === 'structures' ? (
            structures.length === 0 ? (
              <EmptyState
                title="No salary structures configured"
                description="Create a salary structure to group salary rules for payruns."
                actionLabel={canManageSalaryRules ? 'Create Salary Structure' : null}
                onAction={() => {
                  setEditingStructure(null);
                  setIsStructureModalOpen(true);
                }}
                icon={Layers}
              />
            ) : (
              <SalaryStructureList
                structures={structures}
                onEditStructure={(s) => {
                  setEditingStructure(s);
                  setIsStructureModalOpen(true);
                }}
                onDeleteStructure={handleDeleteStructure}
              />
            )
          ) : rules.length === 0 ? (
            <EmptyState
              title="No salary rules configured"
              description="Configure salary rules to calculate earnings, allowances, deductions, and net take-home pay."
              actionLabel={canManageSalaryRules ? 'Create Salary Rule' : null}
              onAction={handleCreateRule}
              icon={Sliders}
            />
          ) : (
            <SalaryRuleList
              rules={rules}
              onEditRule={handleEditRule}
              onDeleteRule={handleDeleteRule}
            />
          )}
        </div>
      )}

      {/* Wizard Modal */}
      <PayrunWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleSuccessToast}
      />

      {/* Detailed Payslip Modal */}
      <PayslipDetailsModal
        isOpen={!!selectedPayslipId}
        onClose={() => setSelectedPayslipId(null)}
        payslipId={selectedPayslipId}
      />

      {/* Salary Structure Form Modal */}
      <SalaryStructureFormModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        structureToEdit={editingStructure}
        onSuccess={handleSuccessToast}
      />

      {/* Salary Rule Form Modal (PDF Requirement A6) */}
      <SalaryRuleFormModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        ruleToEdit={editingRule}
        onSuccess={handleSuccessToast}
      />

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title={confirmDelete?.title || 'Confirm Deletion'}
        message={confirmDelete?.message || 'Are you sure you want to proceed? This action cannot be undone.'}
        confirmText={confirmDelete?.confirmText || 'Delete'}
        variant={confirmDelete?.variant || 'danger'}
      />

      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}
    </div>
  );
};
