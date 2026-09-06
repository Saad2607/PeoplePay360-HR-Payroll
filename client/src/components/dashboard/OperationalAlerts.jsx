import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  UserX,
  Copy,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * OperationalAlerts - Visual alert cards for critical HR and Payroll operational exceptions
 *
 * @param {Object} props
 * @param {Object} props.alerts - Alert datasets from backend aggregation
 * @param {boolean} [props.loading=false] - Loading indicator
 */
export const OperationalAlerts = ({ alerts = {}, loading = false }) => {
  const {
    payrollStatus = {},
    missingRequiredInfo = {},
    duplicatePayslips = {},
    contractAttention = {},
  } = alerts;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm animate-pulse space-y-3"
          >
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const alertCards = [
    {
      id: 'payroll-status',
      title: 'Payroll Status',
      headline: payrollStatus.title || 'All Payruns Reconciled',
      message:
        payrollStatus.message || 'No unverified payruns in current operational cycle.',
      status: payrollStatus.status || 'healthy',
      count: payrollStatus.count || 0,
      icon: PlayCircle,
      link: '/payroll',
      linkLabel: 'Inspect Payruns',
      colorConfig: {
        healthy: {
          border: 'border-emerald-200 bg-emerald-50/40',
          badge: 'bg-emerald-100 text-emerald-800',
          icon: 'bg-emerald-100 text-emerald-700',
        },
        warning: {
          border: 'border-amber-200 bg-amber-50/40',
          badge: 'bg-amber-100 text-amber-800',
          icon: 'bg-amber-100 text-amber-700',
        },
      },
    },
    {
      id: 'missing-info',
      title: 'Missing Required Info',
      headline: missingRequiredInfo.title || 'Profiles Complete',
      message:
        missingRequiredInfo.message ||
        'All active employees possess verified contracts and bank details.',
      status: missingRequiredInfo.status || 'healthy',
      count: missingRequiredInfo.count || 0,
      icon: UserX,
      link: '/employees',
      linkLabel: 'Review Employees',
      colorConfig: {
        healthy: {
          border: 'border-emerald-200 bg-emerald-50/40',
          badge: 'bg-emerald-100 text-emerald-800',
          icon: 'bg-emerald-100 text-emerald-700',
        },
        danger: {
          border: 'border-rose-200 bg-rose-50/40',
          badge: 'bg-rose-100 text-rose-800',
          icon: 'bg-rose-100 text-rose-700',
        },
      },
    },
    {
      id: 'duplicate-payslips',
      title: 'Duplicate Payslips',
      headline: duplicatePayslips.title || 'Zero Duplicate Payslips',
      message:
        duplicatePayslips.message ||
        'All issued payslips are strictly unique per staff cycle.',
      status: duplicatePayslips.status || 'healthy',
      count: duplicatePayslips.count || 0,
      icon: Copy,
      link: '/payroll?tab=payslips',
      linkLabel: 'Audit Payslips',
      colorConfig: {
        healthy: {
          border: 'border-emerald-200 bg-emerald-50/40',
          badge: 'bg-emerald-100 text-emerald-800',
          icon: 'bg-emerald-100 text-emerald-700',
        },
        warning: {
          border: 'border-amber-200 bg-amber-50/40',
          badge: 'bg-amber-100 text-amber-800',
          icon: 'bg-amber-100 text-amber-700',
        },
      },
    },
    {
      id: 'contract-attention',
      title: 'Contract Attention',
      headline: contractAttention.title || 'Contracts In Good Standing',
      message:
        contractAttention.message ||
        'Active employment contracts are valid and within expiration limits.',
      status: contractAttention.status || 'healthy',
      count: contractAttention.count || 0,
      icon: Clock,
      link: '/contracts',
      linkLabel: 'Examine Contracts',
      colorConfig: {
        healthy: {
          border: 'border-emerald-200 bg-emerald-50/40',
          badge: 'bg-emerald-100 text-emerald-800',
          icon: 'bg-emerald-100 text-emerald-700',
        },
        warning: {
          border: 'border-amber-200 bg-amber-50/40',
          badge: 'bg-amber-100 text-amber-800',
          icon: 'bg-amber-100 text-amber-700',
        },
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 flex items-center">
          <ShieldCheck className="w-4 h-4 mr-1.5 text-brand-600" />
          Operational Compliance & Action Alerts
        </h3>
        <span className="text-[11px] text-gray-400 font-medium">Automated System Health Checks</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alertCards.map((card) => {
          const Icon = card.icon;
          const config = card.colorConfig[card.status] || card.colorConfig.healthy;

          return (
            <div
              key={card.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${config.border} bg-white shadow-2xs hover:shadow-sm`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {card.title}
                  </span>

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${config.badge}`}
                  >
                    {card.count > 0 ? `${card.count} Items` : 'Clear'}
                  </span>
                </div>

                <div className="flex items-start space-x-3 mt-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.icon}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-900 leading-snug">
                      {card.headline}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {card.message}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                <Link
                  to={card.link}
                  className="inline-flex items-center text-xs font-semibold text-brand-700 hover:text-brand-900 transition group"
                >
                  <span>{card.linkLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
