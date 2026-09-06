import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, ShieldCheck, User } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('hrmanager@peoplepay360.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { role: 'HR Manager (Priya)', email: 'hrmanager@peoplepay360.com' },
    { role: 'System Admin', email: 'admin@peoplepay360.com' },
    { role: 'HR Payroll User (Krish)', email: 'payrolluser@peoplepay360.com font-bold' },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-brand-950 to-purple-950 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden max-w-md w-full p-8 space-y-6 border border-brand-100">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">PeoplePay360</h1>
          <p className="text-xs text-gray-500 font-medium">HR & Payroll Management System</p>
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 shadow-md shadow-brand-600/20 transition flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In to Account'}
          </button>
        </form>

        {/* Registration Link for New Users */}
        <div className="pt-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700 underline">
              Create New Account
            </Link>
          </p>
        </div>

        {/* Quick Demo Login Switcher */}
        <div className="pt-3 border-t border-gray-100 space-y-2">
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
                    ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
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
