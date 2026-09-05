import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ShieldCheck, User, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/common/Logo';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('hrmanager@peoplepay360.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { role: 'System Admin', email: 'admin@peoplepay360.com' },
    { role: 'HR Manager (Priya)', email: 'hrmanager@peoplepay360.com' },
    { role: 'HR Payroll Manager (Vikram)', email: 'payrollmanager@peoplepay360.com' },
    { role: 'HR Payroll User (Krish)', email: 'payrolluser@peoplepay360.com' },
    { role: 'Standard Employee (Rohan)', email: 'employee@peoplepay360.com' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (accEmail) => {
    setEmail(accEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full p-8 space-y-6 border border-slate-200/80">
        <div className="text-center flex flex-col items-center">
          <Logo size="lg" showText={true} showSubtitle={true} className="flex-col items-center !space-x-0 space-y-2.5" />
          <p className="text-xs text-slate-500 font-medium mt-2">Enterprise HR &amp; Payroll Management Platform</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@peoplepay360.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none transition p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/25 transition-all duration-150 flex items-center justify-center disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In to Account'}
          </button>
        </form>

        {/* Quick Demo Login Switcher */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center">
            Quick Demo Logins (Password: Password123!)
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {demoAccounts.map((acc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDemoAccount(acc.email)}
                className={`w-full text-left px-3 py-1.5 rounded-lg border text-xs flex items-center justify-between transition ${
                  email === acc.email
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{acc.role}</span>
                <span className="font-mono text-[10px] text-gray-400">{acc.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
