import React from 'react';
import { useAuth } from '../context/AuthContext';
import { EmployeeDashboard } from '../components/dashboard/EmployeeDashboard';
import { HRManagerDashboard } from '../components/dashboard/HRManagerDashboard';
import { PayrollUserDashboard } from '../components/dashboard/PayrollUserDashboard';
import { PayrollManagerDashboard } from '../components/dashboard/PayrollManagerDashboard';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';

export const DashboardPage = () => {
  const { role } = useAuth();

  switch (role) {
    case 'Admin':
      return <AdminDashboard />;
    case 'HR Manager':
      return <HRManagerDashboard />;
    case 'HR Payroll Manager':
      return <PayrollManagerDashboard />;
    case 'HR Payroll User':
      return <PayrollUserDashboard />;
    case 'Employee':
    default:
      return <EmployeeDashboard />;
  }
};
