import React, { useEffect, useState } from 'react';
import { Calendar, Layers, MapPin, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useLang } from '../../context/LangContext';

const STATUS_ICONS = {
  pending:     Clock,
  in_progress: RefreshCw,
  resolved:    CheckCircle,
  rejected:    XCircle,
};

const STATUS_COLORS = {
  pending:     'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected:    'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABEL_KEYS = {
  pending:     'statusPending',
  in_progress: 'statusInProgress',
  resolved:    'statusResolved',
  rejected:    'statusRejected',
};

const STATUS_DESC_KEYS = {
  pending:     'statusDescPending',
  in_progress: 'statusDescInProgress',
  resolved:    'statusDescResolved',
  rejected:    'statusDescRejected',
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

const RequestList = ({ category }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    const isGrievance = category === 'grievance';

    if (isGrievance) {
      // Fetch from complaints table
      api.get('/complaints')
        .then(({ data }) => {
          const normalized = data.map(c => ({
            id:               c.id,
            title:            c.complaint_types?.name || 'Complaint',
            description:      JSON.stringify(c.dynamic_data || {}),
            status:           c.status,
            location:         c.city || '',
            created_at:       c.created_at,
            resolution_notes: c.resolution_notes,
            officer:          c.officer,
            category:         'grievance',
          }));
          setRecords(normalized);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      // Fetch from requests/services table
      api.get('/services')
        .then(({ data }) => setRecords(data.filter(r => r.category === 'service')))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [category]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-500 text-sm">{t('loading')}</p>
    </div>
  );

  const title = category === 'service' ? t('myApplications') : t('myGrievances');

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('submittedOn')}</p>
        </div>
        <span className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 text-sm font-bold text-slate-600">
          {records.length}
        </span>
      </div>

      {records.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
          <Layers size={36} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium text-sm">{t('noResults')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map(req => {
            const StatusIcon = STATUS_ICONS[req.status] || Clock;
            const statusColor = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
            const statusLabel = t(STATUS_LABEL_KEYS[req.status] || 'statusPending');
            const statusDesc  = t(STATUS_DESC_KEYS[req.status]  || 'statusDescPending');

            return (
              <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="p-5">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold mb-4 ${statusColor}`}>
                    <StatusIcon size={13} />
                    <span className="font-black">{statusLabel}</span>
                    <span className="text-current opacity-70 font-normal">— {statusDesc}</span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-base leading-tight">{req.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{parseDescription(req.description)}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-300 shrink-0 mt-1">
                      {req.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-400">
                    {req.officer?.department && (
                      <span className="bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 font-medium">{req.officer.department}</span>
                    )}
                    {req.location && <span className="flex items-center gap-1"><MapPin size={11} />{req.location}</span>}
                    <span className="flex items-center gap-1"><Calendar size={11} />{new Date(req.created_at).toLocaleDateString('en-IN')}</span>
                  </div>

                  {req.resolution_notes && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1">{t('officerRemark')}</p>
                      <p className="text-xs text-emerald-800 italic">"{req.resolution_notes}"</p>
                    </div>
                  )}
                </div>

                {req.image_url && (
                  <img src={req.image_url} alt="Reference" className="w-full h-28 object-cover border-t border-slate-100" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestList;
