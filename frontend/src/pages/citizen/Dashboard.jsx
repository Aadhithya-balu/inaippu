import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { LayoutDashboard, FileText, AlertCircle, PlusCircle, Briefcase, Baby, HeartHandshake, FileCheck, Home, Wrench, HelpCircle, ArrowRight } from 'lucide-react';
import AIChat from '../../components/AIChat';
import api from '../../services/api';
import GrievanceForm from './GrievanceForm';
import ServiceForm from './ServiceForm';
import RequestList from './RequestList';
import { useLang } from '../../context/LangContext';

const LIFE_EVENTS = [
  { icon: Baby,          tkLabel: 'birthChild',    tkDesc: 'birthChildDesc',    to: '/citizen/services/new?type=birth',    color: 'blue' },
  { icon: HeartHandshake,tkLabel: 'deathFamily',   tkDesc: 'deathFamilyDesc',   to: '/citizen/services/new?type=death',    color: 'slate' },
  { icon: FileCheck,     tkLabel: 'incomeProof',   tkDesc: 'incomeProofDesc',   to: '/citizen/services/new?type=income',   color: 'emerald' },
  { icon: Home,          tkLabel: 'propertyMatters',tkDesc: 'propertyMattersDesc',to: '/citizen/services/new?type=property',color: 'amber' },
  { icon: Wrench,        tkLabel: 'roadIssue',     tkDesc: 'roadIssueDesc',     to: '/citizen/grievances/new',             color: 'red' },
  { icon: HelpCircle,    tkLabel: 'otherHelp',     tkDesc: 'otherHelpDesc',     to: '/citizen/services/new',               color: 'indigo' },
];

const COLOR_MAP = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    hover: 'hover:border-blue-400',    icon: 'group-hover:bg-blue-600' },
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-600',   hover: 'hover:border-slate-400',   icon: 'group-hover:bg-slate-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'hover:border-emerald-400', icon: 'group-hover:bg-emerald-600' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   hover: 'hover:border-amber-400',   icon: 'group-hover:bg-amber-600' },
  red:     { bg: 'bg-red-50',     text: 'text-red-600',     hover: 'hover:border-red-400',     icon: 'group-hover:bg-red-600' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  hover: 'hover:border-indigo-400',  icon: 'group-hover:bg-indigo-600' },
};

const CitizenOverview = ({ stats }) => {
  const { t } = useLang();
  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Stats */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-5">{t('citizenOverview')}</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:shadow-md transition">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
              <FileText size={20} />
            </div>
            <p className="text-slate-500 text-sm font-medium">{t('serviceApplications')}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.requests}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:shadow-md transition">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-red-600 group-hover:text-white transition">
              <AlertCircle size={20} />
            </div>
            <p className="text-slate-500 text-sm font-medium">{t('activeGrievances')}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.grievances}</p>
          </div>
        </div>
      </div>

      {/* Life Events */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">{t('lifeEvents')}</h2>
        <p className="text-sm text-slate-500 mb-4">{t('lifeEventsDesc')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LIFE_EVENTS.map(({ icon, tkLabel, tkDesc, to, color }) => {
            const c = COLOR_MAP[color];
            return (
              <Link key={tkLabel} to={to}
                className={`group bg-white border-2 border-slate-100 ${c.hover} rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
                <div className={`w-10 h-10 ${c.bg} ${c.text} rounded-xl flex items-center justify-center mb-3 transition-colors ${c.icon} group-hover:text-white`}>
                  {React.createElement(icon, { size: 20 })}
                </div>
                <p className="font-bold text-slate-800 text-sm leading-tight">{t(tkLabel)}</p>
                <p className="text-slate-400 text-xs mt-1 leading-tight">{t(tkDesc)}</p>
                <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${c.text}`}>
                  {t('next')} <ArrowRight size={12} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick actions banner */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-1">{t('needHelp')}</h2>
          <p className="text-blue-100 text-sm mb-4">{t('needHelpDesc')}</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/citizen/grievances/new" className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-50 transition flex items-center gap-2 text-sm">
              <PlusCircle size={16} /> {t('newGrievance')}
            </Link>
            <Link to="/citizen/services/new" className="bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-400 transition flex items-center gap-2 border border-indigo-400 text-sm">
              <Briefcase size={16} /> {t('applyService')}
            </Link>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [stats, setStats] = useState({ requests: 0, grievances: 0 });
  const location = useLocation();
  const { t } = useLang();

  useEffect(() => {
    Promise.all([
      api.get('/services'),
      api.get('/complaints'),
    ]).then(([{ data: services }, { data: complaints }]) => {
      setStats({
        requests:   services.filter(d => d.category === 'service').length,
        grievances: complaints.filter(d => ['pending', 'in_progress'].includes(d.status)).length,
      });
    }).catch(console.error);
  }, [location.pathname]);

  const links = [
    { path: '/citizen',            label: t('overview'),        icon: <LayoutDashboard size={20} /> },
    { path: '/citizen/services',   label: t('myApplications'),  icon: <FileText size={20} /> },
    { path: '/citizen/grievances', label: t('myGrievances'),    icon: <AlertCircle size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] flex-col overflow-hidden font-sans">
      <Navbar role={user?.role} name={user?.name} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={links} />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto relative">
          <Routes>
            <Route path="/"                element={<CitizenOverview stats={stats} />} />
            <Route path="/services"        element={<RequestList category="service" />} />
            <Route path="/services/new"    element={<ServiceForm />} />
            <Route path="/grievances"      element={<RequestList category="grievance" />} />
            <Route path="/grievances/new"  element={<GrievanceForm />} />
          </Routes>
          <div className="fixed bottom-8 right-8 z-50">
            <AIChat />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
