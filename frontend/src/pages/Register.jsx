import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { User, Lock, Save, ArrowLeft, Building2, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';
import FieldError from '../components/FieldError';
import { sanitize, validateAll, scrollToFirstError } from '../utils/validate';

import { useLang } from '../context/LangContext';

const Register = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [step, setStep] = useState('select');
  const [formData, setFormData] = useState({
    aadhaarNumber: '', password: '', role: 'citizen',
    name: '', city: '', officerId: '', department: ''
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Strip HTML tags but don't trim — trimming on keystroke blocks spaces
    const cleaned = typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value;
    setFormData(f => ({ ...f, [name]: cleaned }));
    setErrors(e => ({ ...e, [name]: null }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const isOfficer = formData.role === 'officer';

    const rulesMap = {
      name:          ['required'],
      aadhaarNumber: ['required', 'aadhaar'],
      password:      ['required', 'password'],
      city:          ['required'],
      ...(isOfficer && {
        officerId:   ['required'],
        department:  ['required'],
      }),
    };

    const errs = validateAll(formData, rulesMap);
    if (Object.keys(errs).length) {
      setErrors(errs);
      scrollToFirstError();
      return;
    }

    setSubmitError('');
    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      if (formData.role === 'officer') setStep('pending_verification');
      else navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Connection failed. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role) => {
    setFormData(f => ({ ...f, role }));
    setErrors({});
    setStep(role === 'citizen' ? 'citizen_form' : 'officer_form');
  };

  const inputClass = (field) =>
    `w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition
    ${errors[field] ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20'}`;

  const renderSelect = () => (
    <div className="w-full max-w-4xl p-4 animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter mb-3">
          <span className="text-blue-500">இ</span>naippu
        </h1>
        <p className="text-lg text-slate-600">{t('joinDesc')}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div onClick={() => selectRole('citizen')} className="group cursor-pointer bg-white border-2 border-slate-100 hover:border-blue-500 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors"><User size={32} /></div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">{t('citizenPortal')}</h3>
          <p className="text-slate-500 leading-relaxed">{t('citizenPortalDesc')}</p>
          <div className="mt-8 flex items-center text-blue-600 font-semibold">{t('createAccount')} <ArrowLeft className="ml-2 rotate-180" size={18} /></div>
        </div>
        <div onClick={() => selectRole('officer')} className="group cursor-pointer bg-white border-2 border-slate-100 hover:border-emerald-500 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><ShieldCheck size={32} /></div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">{t('officerPortal')}</h3>
          <p className="text-slate-500 leading-relaxed">{t('officerPortalDesc')}</p>
          <div className="mt-8 flex items-center text-emerald-600 font-semibold">{t('submitVerification')} <ArrowLeft className="ml-2 rotate-180" size={18} /></div>
        </div>
      </div>
      <div className="text-center mt-12 text-slate-500">
        {t('alreadyHaveAccount')}? <Link to="/login" className="text-blue-600 font-bold hover:underline transition">{t('loginHere')}</Link>
      </div>
    </div>
  );

  const renderForm = () => {
    const isOfficer = step === 'officer_form';
    const headerClass = isOfficer ? 'bg-emerald-600' : 'bg-blue-600';
    const buttonClass = isOfficer ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700';
    return (
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        <div className={`${headerClass} p-8 text-white relative`}>
          <button onClick={() => setStep('select')} className="absolute top-6 left-6 text-white/80 hover:text-white transition"><ArrowLeft size={24} /></button>
          <div className="text-center pt-4">
            <h2 className="text-2xl font-bold">{isOfficer ? 'Official Registration' : 'Citizen Sign Up'}</h2>
            <p className="text-white/80 mt-1">{isOfficer ? 'Government Agency' : 'Public Services Portal'}</p>
          </div>
        </div>

        <div className="p-8">
          {submitError && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-medium">{submitError}</div>}

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div data-error={!!errors.name} className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">{t('fullName')}</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="name" onChange={handleChange} value={formData.name} placeholder={t('fullNamePlaceholder')} className={inputClass('name')} />
              </div>
              <FieldError error={errors.name} />
            </div>

            <div data-error={!!errors.aadhaarNumber} className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">{t('aadhaarNumber')}</label>
              <div className="relative">
                <UserCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" maxLength="12" placeholder="1234 5678 9012"
                  onChange={(e) => { setFormData(f => ({ ...f, aadhaarNumber: e.target.value.replace(/\D/g, '') })); setErrors(e => ({ ...e, aadhaarNumber: null })); }}
                  value={formData.aadhaarNumber}
                  className={`${inputClass('aadhaarNumber')} tracking-[0.2em] font-mono`}
                />
              </div>
              <FieldError error={errors.aadhaarNumber} />
            </div>

            <div data-error={!!errors.city}>
              <LocationPicker onChange={({ city }) => { setFormData(f => ({ ...f, city })); setErrors(e => ({ ...e, city: null })); }} />
              <FieldError error={errors.city} />
            </div>

            {isOfficer && (
              <>
                <div data-error={!!errors.department} className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">Department</label>
                  <div className="relative">
                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <select name="department" onChange={handleChange} value={formData.department} className={`${inputClass('department')} appearance-none`}>
                      <option value="">Select Dept</option>
                      <option value="Revenue">Revenue Department</option>
                      <option value="Health">Health & Family Welfare</option>
                      <option value="Urban">Urban Development</option>
                      <option value="PublicWorks">Public Works (PWD)</option>
                    </select>
                  </div>
                  <FieldError error={errors.department} />
                </div>

                <div data-error={!!errors.officerId} className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">Officer ID</label>
                  <div className="relative">
                    <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input name="officerId" onChange={handleChange} value={formData.officerId} placeholder="GOV-XXXXX" className={inputClass('officerId')} />
                  </div>
                  <FieldError error={errors.officerId} />
                </div>
              </>
            )}

            <div data-error={!!errors.password} className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">{t('password')}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" name="password" onChange={handleChange} value={formData.password} placeholder={t('passwordHint')} className={inputClass('password')} />
              </div>
              <FieldError error={errors.password} />
            </div>

            <button disabled={loading} type="submit" className={`w-full py-4 mt-4 ${buttonClass} text-white rounded-2xl font-bold shadow-xl transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50`}>
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Save size={20} />{isOfficer ? t('submitVerification') : t('createAccount')}</>
              }
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      {step === 'select' && renderSelect()}
      {(step === 'citizen_form' || step === 'officer_form') && renderForm()}
      {step === 'pending_verification' && (
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-12 text-center animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-inner"><ShieldCheck size={48} /></div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Request Received</h2>
          <p className="text-slate-500 leading-relaxed mb-10">Verification request has been forwarded to the system administrator. You can log in once the department confirms your credentials.</p>
          <Link to="/login" className="block w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition shadow-2xl active:scale-95">Back to Login</Link>
        </div>
      )}
    </div>
  );
};

export default Register;
