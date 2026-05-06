import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Building, Briefcase, CheckCircle, Clock, AlertTriangle, Save } from 'lucide-react';
import api from '../../services/api';
import LocationPicker from '../../components/LocationPicker';
import FieldError from '../../components/FieldError';
import DocumentUploader from '../../components/DocumentUploader';
import { sanitize, validateAll, scrollToFirstError } from '../../utils/validate';
import { useLang } from '../../context/LangContext';
import useDraft from '../../hooks/useDraft';

const STEPS = ['step1', 'step2', 'step3', 'step4'];

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
          <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${i < current ? 'bg-emerald-400' : 'bg-slate-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const ServiceForm = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const [slaInfo, setSlaInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const departments = ['Revenue', 'Health', 'Urban', 'PublicWorks'];
  const serviceTypes = ['Death Certificate', 'Birth Certificate', 'Income Certificate', 'Community Certificate', 'Property Tax', 'Water Connection'];

  const { data: formData, update, clearDraft, hasDraft, savedAt } = useDraft('service_form', {
    title: '', description: '', category: 'service',
    service_type: '', city: '', department: '',
    image_url: ''
  });

  const [showDraftBanner, setShowDraftBanner] = useState(hasDraft);

  // Fetch SLA for selected service type
  useEffect(() => {
    if (!formData.service_type) { setSlaInfo(null); return; }
    api.get('/admin/sla')
      .then(({ data }) => setSlaInfo(data?.[0] || null))
      .catch(() => setSlaInfo(null));
  }, [formData.service_type]);

  const set = (key, val) => {
    // Strip HTML tags but don't trim — trimming on keystroke blocks spaces
    const cleaned = typeof val === 'string' ? val.replace(/<[^>]*>/g, '') : val;
    update(key, cleaned);
    setErrors(e => ({ ...e, [key]: null }));
  };

  const STEP_VALIDATIONS = [
    { service_type: ['required'] },
    { city: ['required'], department: ['required'] },
    {},
    { description: ['required'] },
  ];

  const handleNext = () => {
    const errs = validateAll(formData, STEP_VALIDATIONS[step]);
    if (Object.keys(errs).length) { setErrors(errs); scrollToFirstError(); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const errs = validateAll(formData, { description: ['required'] });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitError('');
    setLoading(true);
    try {
      await api.post('/services', formData);
      clearDraft();
      navigate('/citizen/services');
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  };

  const selectClass = (field) =>
    `w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none appearance-none transition text-sm
    ${errors[field] ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'}`;

  return (
    <div className="max-w-xl mx-auto pb-20 animate-in slide-in-from-bottom duration-500">
      {/* Draft banner */}
      {showDraftBanner && (
        <div className="mb-4 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <span className="text-amber-800 font-medium">📝 {t('continueDraft')}</span>
          <button onClick={() => { clearDraft(); setShowDraftBanner(false); }} className="text-xs text-amber-600 font-bold underline">{t('discardDraft')}</button>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold">{t('serviceApplication')}</h2>
          <p className="text-indigo-100 text-sm mt-1 opacity-80">{t('serviceApplicationDesc')}</p>
        </div>

        <div className="p-6">
          <StepIndicator current={step} steps={STEPS} t={t} />

          {submitError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 mb-4 text-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />{submitError}
            </div>
          )}

          {/* Step 0: Service type */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div data-error={!!errors.service_type} className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">{t('serviceType')}</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select className={selectClass('service_type')} onChange={e => { set('service_type', e.target.value); set('title', e.target.value); }} value={formData.service_type}>
                    <option value="">{t('selectService')}</option>
                    {serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <FieldError error={errors.service_type} />
              </div>

              {slaInfo && (
                <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs">
                  <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                    <Clock size={14} /> {t('slaNote')}: <span className="font-black">{slaInfo.sla_days} {t('days')}</span>
                  </div>
                  <div className="text-blue-500">{t('slaMax')}: {(slaInfo.sla_days * 2)} {t('days')}</div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Location + Officer */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div data-error={!!errors.city}>
                <LocationPicker onChange={({ city }) => { set('city', city); }} />
                <FieldError error={errors.city} />
              </div>
              <div data-error={!!errors.department} className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">{t('department')}</label>
                <div className="relative">
                  <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select className={selectClass('department')} onChange={e => { set('department', e.target.value); }} value={formData.department}>
                    <option value="">{t('chooseDept')}</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <FieldError error={errors.department} />
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 font-medium">
                Your application will be routed automatically to the least-loaded verified officer based on city and department.
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div className="animate-in fade-in duration-300">
              <DocumentUploader label={t('supportingDocs')} onUpload={url => update('image_url', url)} />
            </div>
          )}

          {/* Step 3: Review + Details */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Review summary */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm border border-slate-100">
                <p className="font-black text-slate-500 text-[10px] uppercase tracking-wider mb-3">Review</p>
                {[
                  ['Service', formData.service_type],
                  ['City', formData.city],
                  ['Department', formData.department],
                ].map(([label, val]) => val && (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800">{val}</span>
                  </div>
                ))}
              </div>
              <div data-error={!!errors.description} className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">{t('applicationDetails')}</label>
                <textarea rows={4} placeholder={t('applicationDetailsPlaceholder')}
                  className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition text-sm
                    ${errors.description ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'}`}
                  onChange={e => set('description', e.target.value)} value={formData.description} />
                <FieldError error={errors.description} />
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
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-indigo-200">
                {t('next')} →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-indigo-200 disabled:opacity-50">
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

export default ServiceForm;
