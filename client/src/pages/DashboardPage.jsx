import React, { useState, useEffect } from 'react';
import { employeeApi } from '../api/employeeApi';
import { contractApi } from '../api/contractApi';
import { departmentApi } from '../api/departmentApi';
import { Users, FileText, Building2, TrendingUp, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { user, isHRManager } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeContracts: 0,
    totalDepartments: 0,
    recentEmployees: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        const [empRes, ctrRes, deptRes] = await Promise.all([
          employeeApi.getAll({ limit: 10 }),
          contractApi.getAll({ status: 'Active' }),
          departmentApi.getAll(),
        ]);

        setStats({
          totalEmployees: empRes.meta?.total || empRes.data?.length || 0,
          activeContracts: ctrRes.meta?.total || ctrRes.data?.length || 0,
          totalDepartments: deptRes.data?.length || 0,
          recentEmployees: empRes.data?.slice(0, 5) || [],
        });
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) return <LoadingSpinner fullScreen label="Loading PeoplePay360 Dashboard analytics..." />;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 mr-1 text-emerald-300" /> PeoplePay360 HR Suite 2026
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-sm text-brand-100 max-w-xl">
            Manage your organization's employees, contracts, working schedules, and payroll integrations seamlessly in real-time.
          </p>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Employees</span>
            <div className="text-3xl font-extrabold text-gray-900 mt-1">{stats.totalEmployees}</div>
            <Link to="/employees" className="text-xs text-brand-600 font-semibold hover:underline flex items-center mt-2">
              View All Directory <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Contracts</span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.activeContracts}</div>
            <Link to="/contracts" className="text-xs text-emerald-600 font-semibold hover:underline flex items-center mt-2">
              View Active Contracts <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Departments</span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1">{stats.totalDepartments}</div>
            <span className="text-xs text-gray-400 block mt-2">Real-time counts active</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900">Quick Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/employees"
            className="p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 transition flex items-center space-x-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Employee Directory & Form</h4>
              <p className="text-xs text-gray-500">Filter, search, view identity, position & schedules.</p>
            </div>
          </Link>

          <Link
            to="/contracts"
            className="p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition flex items-center space-x-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Contract Management & History</h4>
              <p className="text-xs text-gray-500">Manage salary structures, wage types & active contracts.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
