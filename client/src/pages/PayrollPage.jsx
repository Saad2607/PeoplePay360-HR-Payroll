import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { payrunApi } from '../api/payrunApi';
import { payslipApi } from '../api/payslipApi';
import { salaryStructureApi } from '../api/salaryStructureApi';
import { PayrunList } from '../components/payroll/PayrunList';
import { PayrunWizardModal } from '../components/payroll/PayrunWizardModal';
import { PayrunDetails } from '../components/payroll/PayrunDetails';
import { PayslipList } from '../components/payroll/PayslipList';
import { PayslipDetailsModal } from '../components/payroll/PayslipDetailsModal';
import { SalaryStructureList } from '../components/payroll/SalaryStructureList';
import { SalaryStructureFormModal } from '../components/payroll/SalaryStructureFormModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign,
  Plus,
  PlayCircle,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const PayrollPage = () => {
  const { isHRManager, isPayrollUser } = useAuth();
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

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);

  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Fetch Payruns
  const fetchPayruns = async () => {
    setLoading(true);
    try {
      const res = await payrunApi.getAll({ page, limit: 10 });
      setPayruns(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setToast({ message: err.message || 'Failed to load payruns', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Payslips
  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const res = await payslipApi.getAll({ page, limit: 10 });
      setPayslips(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setToast({ message: err.message || 'Failed to load payslips', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Structures
  const fetchStructures = async () => {
    setLoading(true);
    try {
      const res = await salaryStructureApi.getAll();
      setStructures(res.data || []);
    } catch (err) {
      setToast({ message: err.message || 'Failed to load salary structures', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPayrunId) {
      if (activeTab === 'payruns') fetchPayruns();
      else if (activeTab === 'payslips') fetchPayslips();
      else if (activeTab === 'structures') fetchStructures();
    }
  }, [activeTab, page, selectedPayrunId]);

  const handleDeletePayrun = async (run) => {
    if (window.confirm(`Are you sure you want to delete Draft payrun "${run.name}"?`)) {
      try {
        await payrunApi.delete(run._id);
        setToast({ message: 'Draft payrun deleted successfully', type: 'success' });
        fetchPayruns();
      } catch (err) {
        setToast({ message: err.message || 'Failed to delete payrun', type: 'error' });
      }
    }
  };

  const handleDeleteStructure = async (s) => {
    if (window.confirm(`Are you sure you want to delete salary structure "${s.name}"?`)) {
      try {
        await salaryStructureApi.delete(s._id);
        setToast({ message: `Salary structure ${s.name} deleted`, type: 'success' });
        fetchStructures();
      } catch (err) {
        setToast({ message: err.message || 'Failed to delete salary structure', type: 'error' });
      }
    }
  };

  const handleSuccessToast = (msg) => {
    setToast({ message: msg, type: 'success' });
    if (activeTab === 'payruns') fetchPayruns();
    else if (activeTab === 'payslips') fetchPayslips();
    else if (activeTab === 'structures') fetchStructures();
  };

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
            {activeTab === 'payruns' && isPayrollUser && (
              <button
                onClick={() => setIsWizardOpen(true)}
                className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
              >
                <Plus className="w-4 h-4 mr-1.5" /> New Payrun Wizard
              </button>
            )}

            {activeTab === 'structures' && isHRManager && (
              <button
                onClick={() => {
                  setEditingStructure(null);
                  setIsStructureModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Salary Structure
              </button>
            )}
          </div>
        }
      />

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
              actionLabel={isPayrollUser ? 'Launch New Payrun Wizard' : null}
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

      {/* Salary Structures Tab Content */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner label="Loading salary structures..." />
          ) : structures.length === 0 ? (
            <EmptyState
              title="No salary structures configured"
              description="Create a salary structure to group salary rules for payruns."
              actionLabel={isHRManager ? 'Create Salary Structure' : null}
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

      {toast.message && <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: 'success' })} />}
    </div>
  );
};
