import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Lock, LogIn, UserPlus } from 'lucide-react';
import { useLang } from '../context/LangContext';

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [aadhaar, setAadhaar] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { aadhaarNumber: aadhaar, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(`/${data.user.role}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 items-center justify-center font-sans">
      <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
              <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/>
              <path d="m21 3 1 11h-2"/>
              <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/>
              <path d="M3 4h8"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            <span className="text-blue-500">இ</span>naippu
          </h2>
          <p className="text-slate-500 mt-1 text-sm">{t('joinDesc')}</p>
        </div>

        {error && <div className="p-3 bg-red-100 border border-red-200 rounded text-red-700 text-sm font-medium mb-6 text-center">{error}</div>}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1 relative">
            <label className="text-sm font-semibold text-slate-700">{t('aadhaarNumber')}</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                maxLength="12"
                placeholder="1234 5678 9012"
                value={aadhaar}
                onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm text-slate-800 font-medium"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 relative">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700">{t('password')}</label>
              <Link to="#" className="text-xs font-semibold text-blue-600 hover:text-blue-800">Forgot?</Link>
            </div>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm text-slate-800 font-medium tracking-widest"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded font-bold transition shadow"
          >
            <LogIn size={20} />
            {t('loginHere')}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Demo credentials</p>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">Citizen</span>
              <span className="font-mono text-xs">111111111111 / Demo@12345</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">Officer</span>
              <span className="font-mono text-xs">222222222222 / Demo@12345</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">Admin</span>
              <span className="font-mono text-xs">333333333333 / Demo@12345</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm font-medium text-slate-500">
          {t('alreadyHaveAccount')}? <Link to="/register" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1">{t('createAccount')} <UserPlus size={14}/></Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
