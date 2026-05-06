import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, Clock, CheckCircle, XCircle, Loader, AlertCircle, MapPin, Building, User, Calendar, RefreshCw } from 'lucide-react';
import api from '../services/api';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     colorClass: 'bg-amber-50 text-amber-600 border-amber-100',   icon: Clock },
  in_progress: { label: 'In Progress', colorClass: 'bg-blue-50 text-blue-600 border-blue-100',     icon: RefreshCw },
  resolved:    { label: 'Resolved',    colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle },
  rejected:    { label: 'Rejected',    colorClass: 'bg-red-50 text-red-600 border-red-100',         icon: XCircle },
};

const STEP_DONE_CLASSES = {
  pending:     'bg-amber-500 border-amber-500 text-white',
  in_progress: 'bg-blue-500 border-blue-500 text-white',
  resolved:    'bg-emerald-500 border-emerald-500 text-white',
  rejected:    'bg-red-500 border-red-500 text-white',
};

const STEP_TEXT_CLASSES = {
  pending:     'text-amber-600',
  in_progress: 'text-blue-600',
  resolved:    'text-emerald-600',
  rejected:    'text-red-600',
};

const STEPS = ['pending', 'in_progress', 'resolved'];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${cfg.colorClass}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
};

const Timeline = ({ status }) => {
  const currentIdx = status === 'rejected' ? 0 : STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx && status !== 'rejected';
        const rejected = status === 'rejected' && i === 0;
        const cfg = STATUS_CONFIG[step];
        const Icon = cfg.icon;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition
                ${rejected && i === 0 ? 'bg-red-50 border-red-400 text-red-500' :
                  done ? STEP_DONE_CLASSES[step] :
                  'bg-white border-slate-200 text-slate-300'}`}>
                <Icon size={16} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${done ? STEP_TEXT_CLASSES[step] : 'text-slate-300'}`}>
                {cfg.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 ${i < currentIdx && status !== 'rejected' ? 'bg-blue-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Track = () => {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('id') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Defined before useEffect so it can be referenced in deps
  const handleSearchById = useCallback(async (id) => {
    if (!id?.trim()) return;
    setError(''); setResult(null); setLoading(true);
    try {
      const { data } = await api.get(`/complaints/track/${id.trim()}`);
      setResult(data);
    } catch (err) {
      setError(err.response?.status === 404 ? 'No complaint found with this ID.' : 'Something went wrong.');
    } finally { setLoading(false); }
  }, []);

  // Auto-search if id passed via query param
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) handleSearchById(id);
  }, [searchParams, handleSearchById]);

  const handleSearch = (e) => { e.preventDefault(); handleSearchById(input); };

  const fmt = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-slate-400 hover:text-slate-700 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-800">Complaint Tracker</h1>
          <p className="text-xs text-slate-400">Public portal — no login required</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={26} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Track Your Complaint</h2>
            <p className="text-slate-500 text-sm mt-1">Enter your complaint ID to check the current status</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste complaint ID here..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-sm font-mono"
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {result && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`p-6 border-b border-slate-100 flex items-center justify-between
              ${result.status === 'resolved' ? 'bg-emerald-50' : result.status === 'rejected' ? 'bg-red-50' : result.status === 'in_progress' ? 'bg-blue-50' : 'bg-amber-50'}`}>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Complaint ID</p>
                <p className="font-mono text-xs text-slate-600">{result.id}</p>
              </div>
              <StatusBadge status={result.status} />
            </div>

            <div className="p-6 space-y-6">
              <Timeline status={result.status} />
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Calendar,   label: 'Submitted',    value: fmt(result.submitted_at) },
                  { icon: RefreshCw,  label: 'Last Updated', value: fmt(result.updated_at) },
                  { icon: Building,   label: 'Category',     value: result.category },
                  { icon: MapPin,     label: 'City',         value: result.city || '—' },
                  { icon: User,       label: 'Assigned To',  value: result.assigned_to },
                  { icon: Building,   label: 'Department',   value: result.department },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Icon size={10} /> {label}
                    </p>
                    <p className="text-sm font-semibold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>

              {result.resolution_notes && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1">Officer Remarks</p>
                  <p className="text-sm text-emerald-900 border-l-2 border-emerald-300 pl-3 italic">{result.resolution_notes}</p>
                </div>
              )}
              {result.resolved_at && (
                <p className="text-xs text-center text-slate-400">Resolved on {fmt(result.resolved_at)}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Track;
