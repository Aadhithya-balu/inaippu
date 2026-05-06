import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Shield, Zap, Globe, FileText, MessageSquare,
  MapPin, Clock, CheckCircle, ChevronDown, Search
} from 'lucide-react';

// Time-based greeting
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { en: 'Good Morning', ta: 'காலை வணக்கம்' };
  if (h < 17) return { en: 'Good Afternoon', ta: 'மதிய வணக்கம்' };
  return { en: 'Good Evening', ta: 'மாலை வணக்கம்' };
};

const HandshakeLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m11 17 2 2a1 1 0 1 0 3-3"/>
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/>
    <path d="m21 3 1 11h-2"/>
    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/>
    <path d="M3 4h8"/>
  </svg>
);

const FEATURES = [
  { icon: FileText,     title: 'Apply for Services',   desc: 'Birth, death, income certificates — all in one place.',       color: 'blue' },
  { icon: MessageSquare,title: 'File Grievances',      desc: 'Report problems and track resolution in real time.',           color: 'red' },
  { icon: MapPin,       title: 'Location-Based Routing',desc: 'Auto-assigned to the right officer for your area.',          color: 'emerald' },
  { icon: Clock,        title: 'Track Anytime',        desc: 'Check complaint status without logging in.',                   color: 'amber' },
  { icon: Shield,       title: 'Secure & Private',     desc: 'Aadhaar-based auth with masked personal data.',               color: 'indigo' },
  { icon: Zap,          title: 'AI-Powered Help',      desc: 'Groq AI assistant guides you through every step.',            color: 'purple' },
];

const COLOR = {
  blue:    'bg-blue-50 text-blue-600',
  red:     'bg-red-50 text-red-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber:   'bg-amber-50 text-amber-600',
  indigo:  'bg-indigo-50 text-indigo-600',
  purple:  'bg-purple-50 text-purple-600',
};

const STATS = [
  { value: '5+', label: 'States Covered' },
  { value: '18+', label: 'Districts' },
  { value: '290+', label: 'Local Areas' },
  { value: '6', label: 'Service Types' },
];

const Landing = () => {
  const greeting = getGreeting();
  const [visible, setVisible] = useState(false);
  const [trackId, setTrackId] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <HandshakeLogo size={18} />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-900">
            <span className="text-blue-500">இ</span>naippu
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/track" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition hidden sm:block">
            Track Complaint
          </Link>
          <Link to="/login" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md shadow-blue-200">
            Login <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay:'1s'}} />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px]" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{backgroundImage:'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)',backgroundSize:'40px 40px'}} />

        <div className={`relative z-10 text-center px-6 max-w-4xl mx-auto transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Time greeting pill */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {greeting.en} · {greeting.ta}
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-tight tracking-tighter mb-6">
            Government Services,{' '}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Simplified
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 8 Q75 2 150 8 Q225 14 298 8" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
              </svg>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            One platform for all your government needs — apply for certificates, report problems, track status, and get AI-powered guidance in your language.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link to="/register"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-base transition shadow-xl shadow-blue-200 active:scale-95">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 px-8 py-4 rounded-2xl font-bold text-base transition border-2 border-slate-200 hover:border-blue-300 active:scale-95">
              Sign In
            </Link>
          </div>

          {/* Quick track bar */}
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-2 flex gap-2 shadow-lg shadow-slate-100">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                value={trackId}
                onChange={e => setTrackId(e.target.value)}
                placeholder="Paste complaint ID to track..."
                className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700 placeholder-slate-400"
              />
            </div>
            <Link
              to={trackId ? `/track?id=${trackId}` : '/track'}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shrink-0">
              Track
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-400 animate-bounce">
          <span className="text-xs font-medium">Scroll</span>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-900 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-black text-white mb-1">{s.value}</p>
              <p className="text-slate-400 text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6 bg-[#f8fafc]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Built for every citizen</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">From filing a complaint to tracking its resolution — all in one place, in your language.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${COLOR[f.color]}`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-3">Simple process</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">How it works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Register', desc: 'Create your account with Aadhaar ID in under 2 minutes.', color: 'blue' },
              { step: '02', title: 'Submit', desc: 'Apply for a service or file a complaint — guided step by step.', color: 'indigo' },
              { step: '03', title: 'Track', desc: 'Get real-time updates and officer responses on your request.', color: 'emerald' },
            ].map(s => (
              <div key={s.step} className="relative text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-black
                  ${s.color === 'blue' ? 'bg-blue-600 text-white' : s.color === 'indigo' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {s.step}
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-30%] right-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-30%] left-[-10%] w-[300px] h-[300px] bg-white/5 rounded-full blur-[60px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white">
            <HandshakeLogo size={32} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight mb-4">
            Ready to connect with your government?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">Join thousands of citizens already using இnaippu for faster, transparent governance.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register"
              className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold transition shadow-xl active:scale-95">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link to="/track"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold transition border border-white/20 active:scale-95">
              Track a Complaint
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <HandshakeLogo size={14} />
            </div>
            <span className="font-black text-white text-sm">
              <span className="text-blue-400">இ</span>naippu
            </span>
            <span className="text-slate-600 text-xs ml-2">E-Governance Platform</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/login" className="hover:text-white transition">Login</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
            <Link to="/track" className="hover:text-white transition">Track</Link>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} இnaippu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
