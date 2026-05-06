import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  FileText, CheckCircle, Clock, XCircle, User,
  MapPin, AlertCircle, Image as ImageIcon, RefreshCw, Layers
} from 'lucide-react';
import api from '../../services/api';

const STATUS_COLORS = {
  pending:     'bg-amber-50 text-amber-600 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-600 border-blue-200',
  resolved:    'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected:    'bg-red-50 text-red-600 border-red-200',
};

const parseDescription = (desc) => {
  if (!desc) return '';
  try {
    const obj = JSON.parse(desc);
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj)
        .filter(([k, v]) => v && v !== '' && k !== 'image_url')
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join(' · ');
    }
  } catch { /* not JSON */ }
  return desc;
};

// Normalize both complaints and service requests into one shape
const normalize = (item, source) => {
  if (source === 'complaint') {
    return {
      _source:          'complaint',
      id:               item.id,
      title:            item.complaint_types?.name || 'Complaint',
      description:      JSON.stringify(item.dynamic_data || {}),
      status:           item.status,
      priority:         'medium',
      location:         item.city || '',
      created_at:       item.created_at,
      resolution_notes: item.resolution_notes || '',
      image_url:        item.dynamic_data?.image_url || '',
      citizen:          item.citizen || null,
      department:       item.complaint_types?.department || '',
    };
  }
  return { _source: 'request', ...item };
};

const OfficerDashboard = () => {
  const profile = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: requests }, { data: complaints }] = await Promise.all([
        api.get('/services'),
        api.get('/complaints'),
      ]);
      const all = [
        ...requests.map(r => normalize(r, 'request')),
        ...complaints.map(c => normalize(c, 'complaint')),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setItems(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refresh]);

  const path = location.pathname;
  const filtered = items.filter(r => {
    if (path === '/officer/pending')  return r.status === 'pending' || r.status === 'in_progress';
    if (path === '/officer/resolved') return r.status === 'resolved' || r.status === 'rejected';
    return true;
  });

  const updateStatus = async (item, status, notes = '') => {
    try {
      if (item._source === 'complaint') {
        await api.put(`/complaints/${item.id}/status`, { status, resolution_notes: notes });
      } else {
        await api.put(`/services/${item.id}`, { status, resolution_notes: notes });
      }
      setRefresh(r => r + 1);
      setSelectedItem(null);
      setResolutionNotes('');
    } catch (err) { console.error(err); }
  };

  const getTitle = () => {
    if (path === '/officer/pending')  return 'Pending & In Progress';
    if (path === '/officer/resolved') return 'Resolved & Rejected';
    return 'All Assigned Tasks';
  };

  const links = [
    { path: '/officer',          label: 'All Tasks',    icon: <Layers size={20} /> },
    { path: '/officer/pending',  label: 'Pending',      icon: <Clock size={20} /> },
    { path: '/officer/resolved', label: 'Resolved',     icon: <CheckCircle size={20} /> },
  ];

  const activeCount = items.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  return (
    <div className="flex h-screen bg-[#f8fafc] flex-col overflow-hidden font-sans">
      <Navbar role={profile?.role} name={profile?.name} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={links} />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">

          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{getTitle()}</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {profile?.department && profile?.city
                  ? `${profile.department} · ${profile.city}`
                  : 'Officer Portal'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-sm font-semibold text-slate-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Active: {activeCount}
              </div>
              <button onClick={() => setRefresh(r => r + 1)}
                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                <RefreshCw size={16} className="text-slate-500" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-20">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-slate-200 text-center text-slate-400">
              <FileText size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">No records in this category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(item => (
                <div key={`${item._source}-${item.id}`}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_COLORS[item.status] || STATUS_COLORS.pending}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${item._source === 'complaint' ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {item._source === 'complaint' ? 'Complaint' : 'Service'}
                      </span>
                      {item.department && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {item.department}
                        </span>
                      )}
                      {(item.priority === 'high' || item.priority === 'urgent') && (
                        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <AlertCircle size={11} /> {item.priority.toUpperCase()}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-400 ml-auto">
                        REF-{item.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-5">
                      <div className="flex-1 space-y-2">
                        <h2 className="text-lg font-bold text-slate-800">{item.title}</h2>
                        <p className="text-sm text-slate-500 leading-relaxed">{parseDescription(item.description)}</p>

                        {item.resolution_notes && (
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-700 uppercase mb-1">Resolution</p>
                            <p className="text-xs text-emerald-900 italic">"{item.resolution_notes}"</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 pt-1 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            <User size={12} /> {item.citizen?.name || 'Citizen'}
                          </span>
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {item.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {new Date(item.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="lg:w-48 flex flex-col gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt="Reference"
                            className="w-full h-28 object-cover rounded-xl border border-slate-100" />
                        ) : (
                          <div className="w-full h-28 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 border border-dashed border-slate-200">
                            <ImageIcon size={24} />
                          </div>
                        )}
                        <div className="flex gap-2">
                          {item.status === 'pending' && (
                            <button onClick={() => updateStatus(item, 'in_progress')}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition">
                              Process
                            </button>
                          )}
                          {item.status === 'in_progress' && (
                            <button onClick={() => { setSelectedItem(item); setResolutionNotes(''); }}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition">
                              Resolve
                            </button>
                          )}
                          {item.status !== 'resolved' && item.status !== 'rejected' && (
                            <button onClick={() => updateStatus(item, 'rejected')}
                              className="p-2.5 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition">
                              <XCircle size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedItem?.id === item.id && (
                    <div className="absolute inset-0 bg-white/96 backdrop-blur-sm z-10 flex flex-col p-6 rounded-2xl border-2 border-emerald-500 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Resolution Notes</h3>
                        <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">
                          <XCircle size={22} />
                        </button>
                      </div>
                      <textarea
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-sm mb-4 resize-none"
                        placeholder="Describe how the issue was resolved..."
                        value={resolutionNotes}
                        onChange={e => setResolutionNotes(e.target.value)}
                      />
                      <button onClick={() => updateStatus(selectedItem, 'resolved', resolutionNotes)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition">
                        Mark as Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OfficerDashboard;
