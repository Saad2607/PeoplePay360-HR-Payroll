import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('peoplepay360_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('peoplepay360_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          localStorage.setItem('peoplepay360_user', JSON.stringify(res.data));
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('peoplepay360_token');
          localStorage.removeItem('peoplepay360_user');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { user: userData, token: userToken } = res.data;
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('peoplepay360_token', userToken);
    localStorage.setItem('peoplepay360_user', JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setToken(null);
  };

  // 5 Official Roles
  const role = user?.role || 'Employee';
  const isEmployee = role === 'Employee';
  const isHRManager = role === 'HR Manager';
  const isPayrollUser = role === 'HR Payroll User';
  const isPayrollManager = role === 'HR Payroll Manager';
  const isAdmin = role === 'Admin';

  // Permission & Capability Helpers
  const canManageHR = ['Admin', 'HR Manager'].includes(role);
  const canExecutePayroll = ['Admin', 'HR Payroll User', 'HR Payroll Manager'].includes(role);
  const canManageSalaryRules = ['Admin', 'HR Payroll Manager'].includes(role);
  const canManageUsers = isAdmin;
  const isSelfServiceOnly = isEmployee;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        role,
        isEmployee,
        isHRManager,
        isPayrollUser,
        isPayrollManager,
        isAdmin,
        canManageHR,
        canExecutePayroll,
        canManageSalaryRules,
        canManageUsers,
        isSelfServiceOnly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
