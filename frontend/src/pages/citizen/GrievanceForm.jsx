import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ChevronDown, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import api from '../../services/api';
import LocationPicker from '../../components/LocationPicker';
import FieldError from '../../components/FieldError';
import DocumentUploader from '../../components/DocumentUploader';
import { sanitize, validateDynamicSchema, scrollToFirstError } from '../../utils/validate';
import { useLang } from '../../context/LangContext';
import useDraft from '../../hooks/useDraft';

const STEPS = ['step1', 'step2', 'step3'];

const StepIndicator = ({ current, steps, t }) => (
  <div className="flex items-center gap-0 mb-8">
    {steps.map((s, i) => (
      <React.Fragment key={s}>
        <div className="flex flex-col items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all
            ${i < current ? 'bg-emerald-500 text-white' : i === current ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}>
            {i < current ? <CheckCircle size={14} /> : i + 1}
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block ${i === current ? 'text-blue-600' : 'text-slate-400'}`}>
            {t(s)}
          </span>
        </div>
        {i < steps.length - 1 && (
          <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < current ? 'bg-emerald-400' : 'bg-slate-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const DynamicField = ({ field, value, onChange, error }) => {
  const base = `w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition text-slate-800 text-sm
    ${error ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'}`;

  if (field.type === 'select') return (
    <div className="relative">
      <select value={value || ''} onChange={e => onChange(field.key, e.target.value)} className={`${base} appearance-none pr-10`}>
        <option value="">Select {field.label}</option>
        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
  if (field.type === 'textarea') return (
    <textarea rows={3} placeholder={field.placeholder || ''} value={value || ''} onChange={e => onChange(field.key, e.target.value)} className={base} />
  );
  return <input type="text" placeholder={field.placeholder || ''} value={value || ''} onChange={e => onChange(field.key, e.target.value.replace(/<[^>]*>/g, ''))} className={base} />;
};

const GrievanceForm = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [routingNote, setRoutingNote] = useState('');

  const { data: dynamicData, update, updateAll, clearDraft, hasDraft, savedAt } = useDraft('grievance_form', {});
  const [showDraftBanner, setShowDraftBanner] = useState(hasDraft);

  useEffect(() => {
    api.get('/complaints/types')
      .then(({ data }) => setComplaintTypes(data))
      .catch(() => setSubmitError('Failed to load complaint categories.'));
  }, []);

  const handleTypeChange = (typeId) => {
    setSelectedType(complaintTypes.find(t => t.id === typeId) || null);
    updateAll({});
    setErrors({});
  };

  const handleFieldChange = (key, val) => {
    const cleaned = typeof val === 'string' ? val.replace(/<[^>]*>/g, '') : val;
    update(key, cleaned);
    setErrors(e => ({ ...e, [key]: null }));
  };

  const handleNext = () => {
    if (step === 0 && !selectedType) { setErrors({ type: t('complaintCategory') + ' is required.' }); return; }
    if (step === 1) {
      const errs = validateDynamicSchema(dynamicData, selectedType?.schema || []);
      if (Object.keys(errs).length) { setErrors(errs); scrollToFirstError(); return; }
    }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!city) { setErrors({ city: 'Please select your city.' }); return; }
    setSubmitError('');
    setLoading(true);
    try {
      const { data } = await api.post('/complaints', { type_id: selectedType.id, dynamic_data: dynamicData, city });
      clearDraft();
      setRoutingNote(data.routing_note || t('grievanceSubmitted'));
      setTimeout(() => navigate('/citizen/grievances'), 2500);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit.');
    } finally {
      setLoading(false);
    }
  };

  if (routingNote) return (
    <div className="max-w-xl mx-auto mt-16 text-center animate-in zoom-in duration-500">
      <div className="bg-white rounded-3xl p-12 shadow-xl border border-slate-100">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{t('grievanceSubmitted')}</h2>
        <p className="text-sm text-slate-500 mb-1">{routingNote}</p>
        <p className="text-xs text-slate-400 mt-2">{t('redirecting')}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto pb-20 animate-in slide-in-from-bottom duration-500">
      {showDraftBanner && (
        <div className="mb-4 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <span className="text-amber-800 font-medium">📝 {t('continueDraft')}</span>
          <button onClick={() => { clearDraft(); setShowDraftBanner(false); }} className="text-xs text-amber-600 font-bold underline">{t('discardDraft')}</button>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-6 text-white">
          <h2 className="text-2xl font-bold">{t('newGrievanceTitle')}</h2>
          <p className="text-blue-100 text-sm mt-1 opacity-80">{t('newGrievanceDesc')}</p>
        </div>

        <div className="p-6">
          <StepIndicator current={step} steps={STEPS} t={t} />

          {submitError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 mb-4 text-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />{submitError}
            </div>
          )}

          {/* Step 0: Category */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div data-error={!!errors.type} className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">{t('complaintCategory')}</label>
                <div className="relative">
                  <select
                    className={`w-full px-4 py-3.5 bg-slate-50 border-2 rounded-xl focus:ring-2 focus:outline-none appearance-none transition text-sm font-medium pr-10
                      ${errors.type ? 'border-red-400' : 'border-slate-200 focus:border-blue-400 focus:ring-blue-500/20'}`}
                    onChange={e => handleTypeChange(e.target.value)} value={selectedType?.id || ''}>
                    <option value="">{t('selectCategory')}</option>
                    {complaintTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <FieldError error={errors.type} />
                {selectedType?.department && (
                  <p className="text-xs text-slate-400">{t('routesTo')}: <span className="font-semibold text-slate-600">{selectedType.department}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Dynamic fields */}
          {step === 1 && selectedType && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {selectedType.schema.map(field => (
                <div key={field.key} data-error={!!errors[field.key]} className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    {field.label}{field.required && <span className="text-red-500">*</span>}
                  </label>
                  <DynamicField field={field} value={dynamicData[field.key]} onChange={handleFieldChange} error={errors[field.key]} />
                  <FieldError error={errors[field.key]} />
                </div>
              ))}
              <div>
                <DocumentUploader label={t('supportingDocs')} onUpload={url => update('image_url', url)} />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div data-error={!!errors.city}>
                <LocationPicker onChange={({ city: c }) => { setCity(c); setErrors(e => ({ ...e, city: null })); }} />
                <FieldError error={errors.city} />
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 font-medium">
                <span>ℹ</span> {t('autoAssignNote')}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition">
                  ← {t('back')}
                </button>
              )}
              {savedAt && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Save size={10} /> {t('draftSaved')}
                </span>
              )}
            </div>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-blue-200">
                {t('next')} →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-blue-200 disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                {t('submit')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrievanceForm;
