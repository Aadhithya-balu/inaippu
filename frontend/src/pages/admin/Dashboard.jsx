import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import {
  Database, Settings, Users as UsersIcon, Activity,
  UserCheck, Trash2, ShieldCheck, Plus, Pencil, X, Save, Loader,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
// ── Shared ───────────────────────────────────────────────────
const Spinner = () => <div className="flex justify-center p-12"><Loader size={28} className="animate-spin text-blue-500" /></div>;
const Err = ({ msg }) => msg ? <p className="text-sm text-red-600 font-medium mt-2">{msg}</p> : null;

const OfficerVerificationPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setMsg('Failed to load officers.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingOfficers = useMemo(
    () => users.filter(user => user.role === 'officer' && !user.verified).sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')),
    [users]
  );

  const verify = async (id) => {
    setMsg('');
    try {
      await api.put(`/admin/users/${id}/verify`);
      load();
    } catch (error) {
      setMsg(error.response?.data?.error || 'Verification failed.');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Officer Verification</h2>
        <p className="text-slate-500 text-sm">Approve pending officers and review their current workload.</p>
      </div>

      <Err msg={msg} />

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-widest font-bold text-slate-500">
              <th className="p-4 border-b">Officer</th>
              <th className="p-4 border-b">City / Dept</th>
              <th className="p-4 border-b">Workload</th>
              <th className="p-4 border-b text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pendingOfficers.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-slate-400" colSpan={4}>No pending officer accounts.</td>
              </tr>
            ) : pendingOfficers.map(officer => (
              <tr key={officer.id} className="hover:bg-slate-50/50 transition">
                <td className="p-4">
                  <div className="font-bold text-slate-800 text-sm">{officer.name}</div>
                  <div className="text-xs text-slate-400 font-mono">XXXX-XXXX-{officer.aadhaar_number?.slice(-4) || '----'}</div>
                </td>
                <td className="p-4 text-sm text-slate-600">{officer.city || '—'}{officer.department ? ` · ${officer.department}` : ''}</td>
                <td className="p-4 text-sm text-slate-600">{officer.workload_count ?? 0}</td>
                <td className="p-4 text-right">
                  <button onClick={() => verify(officer.id)} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2 ml-auto">
                    <UserCheck size={14} /> Verify
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── User Directory ───────────────────────────────────────────
const UserDirectory = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(() => {
    setLoading(true);
    api.get('/admin/users').then(({ data }) => setUsers(data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  if (loading) return <Spinner />;

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">User Management</h2>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
              <th className="p-5 border-b">User</th>
              <th className="p-5 border-b">Role</th>
              <th className="p-5 border-b">City / Dept</th>
              <th className="p-5 border-b">Status</th>
              <th className="p-5 border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${u.role === 'officer' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                      {u.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{u.name}</div>
                      <div className="text-xs text-slate-400 font-mono">XXXX-XXXX-{u.aadhaar_number?.slice(-4) || '????'}</div>
                    </div>
                  </div>
                </td>
                <td className="p-5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-slate-900 text-white' : u.role === 'officer' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-5 text-sm text-slate-600">{u.city || '—'}{u.department ? ` · ${u.department}` : ''}</td>
                <td className="p-5">
                  {u.verified
                    ? <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><ShieldCheck size={13} /> Verified</span>
                    : <span className="text-amber-500 font-bold text-xs">Pending</span>}
                </td>
                <td className="p-5 text-right space-x-1">
                  {!u.verified && u.role === 'officer' && (
                    <button onClick={() => api.put(`/admin/users/${u.id}/verify`).then(loadUsers)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition" title="Verify">
                      <UserCheck size={16} />
                    </button>
                  )}
                  {u.role !== 'admin' && (
                    <button onClick={() => window.confirm('Delete this user?') && api.delete(`/admin/users/${u.id}`).then(loadUsers)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Config Panel ─────────────────────────────────────────────
const ConfigPanel = () => {
  const [tab, setTab] = useState('types');

  // Complaint Types state
  const [types, setTypes] = useState([]);
  const [depts, setDepts] = useState([]);
  const [sla, setSla] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Type form
  const [typeForm, setTypeForm] = useState({ id: null, name: '', department: '', schema: [] });
  const [typeEditing, setTypeEditing] = useState(false);
  // Schema field builder
  const [newField, setNewField] = useState({ key: '', label: '', type: 'text', required: true });

  // Dept form
  const [deptForm, setDeptForm] = useState({ id: null, name: '' });

  // SLA form
  const [slaEditing, setSlaEditing] = useState(null); // { service_id, sla_days }

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, d, s] = await Promise.all([
        api.get('/admin/complaint-types'),
        api.get('/admin/departments'),
        api.get('/admin/sla'),
      ]);
      setTypes(t.data); setDepts(d.data); setSla(s.data);
    } catch { setErr('Failed to load config.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Type CRUD
  const saveType = async () => {
    if (!typeForm.name.trim()) return setErr('Name is required.');
    setErr('');
    try {
      if (typeForm.id) await api.put(`/admin/complaint-types/${typeForm.id}`, typeForm);
      else await api.post('/admin/complaint-types', typeForm);
      setTypeForm({ id: null, name: '', department: '', schema: [] });
      setTypeEditing(false);
      loadAll();
    } catch (e) { setErr(e.response?.data?.error || 'Save failed.'); }
  };

  const deleteType = async (id) => {
    if (!window.confirm('Delete this complaint type?')) return;
    await api.delete(`/admin/complaint-types/${id}`);
    loadAll();
  };

  const addField = () => {
    if (!newField.key || !newField.label) return;
    setTypeForm(f => ({ ...f, schema: [...f.schema, { ...newField }] }));
    setNewField({ key: '', label: '', type: 'text', required: true });
  };

  const removeField = (idx) => setTypeForm(f => ({ ...f, schema: f.schema.filter((_, i) => i !== idx) }));

  // ── Dept CRUD
  const saveDept = async () => {
    if (!deptForm.name.trim()) return setErr('Name is required.');
    setErr('');
    try {
      if (deptForm.id) await api.put(`/admin/departments/${deptForm.id}`, { name: deptForm.name });
      else await api.post('/admin/departments', { name: deptForm.name });
      setDeptForm({ id: null, name: '' });
      loadAll();
    } catch (e) { setErr(e.response?.data?.error || 'Save failed: ' + e.message); }
  };

  // ── SLA
  const saveSla = async (service_id, sla_days) => {
    await api.put('/admin/sla', { service_id, sla_days: parseInt(sla_days) });
    setSlaEditing(null);
    loadAll();
  };

  if (loading) return <Spinner />;

  const tabClass = (t) => `px-4 py-2 rounded-xl text-sm font-bold transition ${tab === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Platform Configuration</h2>
        <div className="flex gap-2">
          <button className={tabClass('types')} onClick={() => setTab('types')}>Complaint Types</button>
          <button className={tabClass('depts')} onClick={() => setTab('depts')}>Departments</button>
          <button className={tabClass('sla')} onClick={() => setTab('sla')}>SLA</button>
        </div>
      </div>

      <Err msg={err} />

      {/* ── Complaint Types Tab ── */}
      {tab === 'types' && (
        <div className="space-y-4">
          <button onClick={() => { setTypeForm({ id: null, name: '', department: '', schema: [] }); setTypeEditing(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition">
            <Plus size={16} /> New Complaint Type
          </button>

          {typeEditing && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-slate-800">{typeForm.id ? 'Edit' : 'New'} Complaint Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Name</label>
                  <input value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                  <select value={typeForm.department} onChange={e => setTypeForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none appearance-none">
                    <option value="">None</option>
                    {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Schema builder */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Form Fields (Schema)</label>
                {typeForm.schema.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-mono text-slate-600 flex-1">{f.key}</span>
                    <span className="text-slate-500">{f.label}</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{f.type}</span>
                    {f.required && <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full">required</span>}
                    <button onClick={() => removeField(i)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                  </div>
                ))}
                <div className="grid grid-cols-5 gap-2 mt-2">
                  <input placeholder="key" value={newField.key} onChange={e => setNewField(f => ({ ...f, key: e.target.value }))}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none" />
                  <input placeholder="label" value={newField.label} onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none" />
                  <select value={newField.type} onChange={e => setNewField(f => ({ ...f, type: e.target.value }))}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none appearance-none">
                    <option value="text">text</option>
                    <option value="textarea">textarea</option>
                    <option value="select">select</option>
                    <option value="number">number</option>
                  </select>
                  <select value={newField.required} onChange={e => setNewField(f => ({ ...f, required: e.target.value === 'true' }))}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none appearance-none">
                    <option value="true">required</option>
                    <option value="false">optional</option>
                  </select>
                  <button onClick={addField} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition">
                    + Add
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={saveType} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition">
                  <Save size={15} /> Save
                </button>
                <button onClick={() => setTypeEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  <th className="p-4 border-b">Name</th>
                  <th className="p-4 border-b">Department</th>
                  <th className="p-4 border-b">Fields</th>
                  <th className="p-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {types.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-semibold text-slate-800 text-sm">{t.name}</td>
                    <td className="p-4 text-sm text-slate-500">{t.department || '—'}</td>
                    <td className="p-4 text-sm text-slate-500">{t.schema?.length || 0} fields</td>
                    <td className="p-4 text-right space-x-1">
                      <button onClick={() => { setTypeForm({ id: t.id, name: t.name, department: t.department || '', schema: t.schema || [] }); setTypeEditing(true); }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition"><Pencil size={15} /></button>
                      <button onClick={() => deleteType(t.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Departments Tab ── */}
      {tab === 'depts' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Department Name</label>
              <input value={deptForm.name} onChange={e => setDeptForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Water Board"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <button onClick={saveDept} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition">
              <Save size={15} /> {deptForm.id ? 'Update' : 'Add'}
            </button>
            {deptForm.id && (
              <button onClick={() => setDeptForm({ id: null, name: '' })} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold">Cancel</button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  <th className="p-4 border-b">Name</th>
                  <th className="p-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {depts.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-semibold text-slate-800 text-sm">{d.name}</td>
                    <td className="p-4 text-right space-x-1">
                      <button onClick={() => setDeptForm({ id: d.id, name: d.name })} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition"><Pencil size={15} /></button>
                      <button onClick={() => window.confirm('Delete?') && api.delete(`/admin/departments/${d.id}`).then(loadAll)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SLA Tab ── */}
      {tab === 'sla' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                <th className="p-4 border-b">Complaint Type</th>
                <th className="p-4 border-b">SLA (days)</th>
                <th className="p-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {types.map(t => {
                const existing = sla.find(s => s.service_id === t.id);
                const isEditing = slaEditing?.service_id === t.id;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-semibold text-slate-800 text-sm">{t.name}</td>
                    <td className="p-4">
                      {isEditing ? (
                        <input type="number" min="1" value={slaEditing.sla_days}
                          onChange={e => setSlaEditing(s => ({ ...s, sla_days: e.target.value }))}
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" />
                      ) : (
                        <span className="text-sm text-slate-600">{existing?.sla_days ?? '—'} days</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveSla(t.id, slaEditing.sla_days)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition"><Save size={15} /></button>
                          <button onClick={() => setSlaEditing(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition"><X size={15} /></button>
                        </>
                      ) : (
                        <button onClick={() => setSlaEditing({ service_id: t.id, sla_days: existing?.sla_days || 7 })}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition"><Pencil size={15} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Overview ─────────────────────────────────────────────────
const Overview = () => {
  const [stats, setStats] = useState({ citizenCount: 0, processingCount: 0, resolutionRate: 100, avgResponse: '—' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  const CARD_COLORS = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600' },
  };

  const cards = [
    { label: 'Residents',    value: stats.citizenCount,    color: 'blue',    badge: 'LIVE' },
    { label: 'Active',       value: stats.processingCount, color: 'amber',   badge: 'QUEUE' },
    { label: 'Resolution',   value: stats.resolutionRate + '%', color: 'emerald', badge: 'SUCCESS' },
    { label: 'Avg Response', value: stats.avgResponse,     color: 'indigo',  badge: 'DYNAMIC' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Platform Analytics</h1>
      <p className="text-slate-500 mb-8">Real-time system health and processing efficiency.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {cards.map(c => {
          const colorClasses = CARD_COLORS[c.color];
          return (
            <div key={c.label} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <div className={`p-2 ${colorClasses.bg} ${colorClasses.text} rounded-lg`}><Activity size={20} /></div>
                <span className={`text-xs font-bold ${colorClasses.text}`}>{c.badge}</span>
              </div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{c.label}</div>
              <div className="text-3xl font-bold text-slate-900">{loading ? '...' : c.value}</div>
            </div>
          );
        })}
      </div>
      <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden">
        <h2 className="text-4xl font-bold mb-4 tracking-tighter">System Health: Stable</h2>
        <p className="text-slate-400 text-lg max-w-xl mb-8">All services operational. Supabase connected. Gemini AI active.</p>
        <div className="flex gap-4">
          <div className="px-6 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">v1.3.0-STABLE</div>
          <div className="px-6 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest">Cloud Sync Active</div>
        </div>
        <div className="absolute right-10 top-10 opacity-10"><Database size={200} /></div>
      </div>
    </div>
  );
};

// ── Root Dashboard ────────────────────────────────────────────
const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const links = [
    { path: '/admin',          label: 'Overview',      icon: <Activity size={20} /> },
    { path: '/admin/officers', label: 'Officers',      icon: <UserCheck size={20} /> },
    { path: '/admin/users',    label: 'Manage Users',  icon: <UsersIcon size={20} /> },
    { path: '/admin/settings', label: 'Platform Config', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] flex-col overflow-hidden font-sans">
      <Navbar role="Administrator" name={user?.name || 'System Admin'} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={links} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/"         element={<Overview />} />
            <Route path="/officers" element={<OfficerVerificationPanel />} />
            <Route path="/users"    element={<UserDirectory />} />
            <Route path="/settings" element={<ConfigPanel />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
