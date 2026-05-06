import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Bell, Zap, ZapOff } from 'lucide-react';
import { useLang } from '../context/LangContext';

const ROLE_COLORS = {
  citizen:       'bg-blue-500/20 text-blue-200',
  officer:       'bg-emerald-500/20 text-emerald-200',
  admin:         'bg-purple-500/20 text-purple-200',
  Administrator: 'bg-purple-500/20 text-purple-200',
};

// Lite mode stored in localStorage
export const isLiteMode = () => localStorage.getItem('liteMode') === 'true';

const Navbar = ({ role, name }) => {
  const navigate = useNavigate();
  const { lang, switchLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [liteMode, setLiteMode] = useState(isLiteMode);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notifications') || '[]'); } catch { return []; }
  });

  const unread = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleLite = () => {
    const next = !liteMode;
    setLiteMode(next);
    localStorage.setItem('liteMode', next);
    document.documentElement.classList.toggle('lite', next);
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  useEffect(() => {
    if (liteMode) document.documentElement.classList.add('lite');
    else document.documentElement.classList.remove('lite');
  }, []);

  const displayRole = role === 'admin' ? 'Administrator' : role;
  const homeLink = role === 'Administrator' ? '/admin' : `/${role}`;

  return (
    <nav className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg shrink-0 z-40 relative">
      <Link to={homeLink} className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
            <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/>
            <path d="m21 3 1 11h-2"/>
            <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/>
            <path d="M3 4h8"/>
          </svg>
        </div>
        <span className="font-black text-lg tracking-tight">
          <span className="text-blue-400">இ</span><span className="text-white">naippu</span>
        </span>
      </Link>

      {/* Desktop controls */}
      <div className="hidden sm:flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center bg-white/10 rounded-lg overflow-hidden text-xs font-bold">
          <button onClick={() => switchLang('en')} className={`px-2.5 py-1.5 transition ${lang === 'en' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}>EN</button>
          <button onClick={() => switchLang('ta')} className={`px-2.5 py-1.5 transition ${lang === 'ta' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}>த</button>
        </div>

        {/* Lite mode */}
        <button onClick={toggleLite} title={t('liteMode')}
          className={`p-2 rounded-lg transition ${liteMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/10 text-white/60 hover:text-white'}`}>
          {liteMode ? <ZapOff size={16} /> : <Zap size={16} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setNotifOpen(o => !o)} className="relative p-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
            <Bell size={16} />
            {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center">{unread}</span>}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-800">{t('notifications')}</span>
                {unread > 0 && <button onClick={markAllRead} className="text-xs text-blue-600 font-semibold">{t('markAllRead')}</button>}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0
                  ? <p className="text-center text-slate-400 text-sm py-8">{t('noNotifications')}</p>
                  : notifications.map((n, i) => (
                    <div key={i} className={`px-4 py-3 border-b border-slate-50 text-sm ${n.read ? 'text-slate-400' : 'text-slate-700 font-medium bg-blue-50/50'}`}>
                      {n.message}
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(n.time).toLocaleString()}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${ROLE_COLORS[role] || 'bg-white/10 text-white/70'}`}>{displayRole}</span>
        <span className="text-slate-300 text-sm font-medium">{name}</span>
        <button onClick={handleLogout} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-semibold transition">
          <LogOut size={15} /> {t('logout')}
        </button>
      </div>

      {/* Mobile toggle */}
      <button className="sm:hidden p-2 rounded-lg hover:bg-white/10 transition" onClick={() => setMenuOpen(o => !o)}>
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {menuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-slate-900 border-t border-white/10 px-4 py-4 flex flex-col gap-3 sm:hidden z-50 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/10 rounded-lg overflow-hidden text-xs font-bold">
              <button onClick={() => switchLang('en')} className={`px-3 py-2 ${lang === 'en' ? 'bg-blue-500 text-white' : 'text-white/60'}`}>EN</button>
              <button onClick={() => switchLang('ta')} className={`px-3 py-2 ${lang === 'ta' ? 'bg-blue-500 text-white' : 'text-white/60'}`}>த</button>
            </div>
            <button onClick={toggleLite} className={`p-2 rounded-lg ${liteMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/10 text-white/60'}`}>
              {liteMode ? <ZapOff size={16} /> : <Zap size={16} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${ROLE_COLORS[role] || 'bg-white/10 text-white/70'}`}>{displayRole}</span>
            <span className="text-slate-300 text-sm">{name}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-sm font-semibold transition w-full">
            <LogOut size={16} /> {t('logout')}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
