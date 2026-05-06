import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Locate, Loader, X } from 'lucide-react';
const API = 'https://inaippu-sr3w.onrender.com/api';

const dedup = (arr) => arr.filter((item, idx, self) =>
  idx === self.findIndex(t => t.name === item.name)
);

// ── Searchable dropdown ──────────────────────────────────────
const SearchableSelect = ({ options, value, onChange, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find(o => o.id === value);
  const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-3 bg-slate-50 border rounded-xl text-left text-sm transition
          ${disabled ? 'opacity-40 cursor-not-allowed border-slate-200' : 'border-slate-200 hover:border-blue-400 cursor-pointer'}
          ${open ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}`}
      >
        <MapPin size={14} className="text-slate-400 shrink-0" />
        <span className={`flex-1 truncate ${selected ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
          {selected ? selected.name : placeholder}
        </span>
        {selected && !disabled
          ? <X size={13} className="text-slate-400 hover:text-red-400 shrink-0"
              onClick={e => { e.stopPropagation(); onChange('', ''); setSearch(''); }} />
          : <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      {open && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <li className="px-4 py-3 text-sm text-slate-400 text-center">No results</li>
              : filtered.map(opt => (
                <li
                  key={opt.id}
                  onClick={() => { onChange(opt.id, opt.name); setOpen(false); setSearch(''); }}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition
                    ${opt.id === value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {opt.name}
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  );
};

// ── Main LocationPicker ──────────────────────────────────────
const LocationPicker = ({ onChange, required = true }) => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [zones,  setZones]  = useState([]);

  const [stateId,   setStateId]   = useState('');
  const [stateName, setStateName] = useState('');
  const [cityId,    setCityId]    = useState('');
  const [cityName,  setCityName]  = useState('');
  const [zoneId,    setZoneId]    = useState('');
  const [zoneName,  setZoneName]  = useState('');

  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Load states on mount
  useEffect(() => {
    const tryFetch = (retries = 3) => {
      fetch(`${API}/location/states`)
        .then(r => r.json())
        .then(data => {
          if (!Array.isArray(data) || data.length === 0) {
            setError('No states found. Please run schema.sql in Supabase.');
            return;
          }
          setStates(dedup(data));
          setError('');
        })
        .catch(() => {
          if (retries > 0) {
            setTimeout(() => tryFetch(retries - 1), 5000);
            setError('Connecting to server... please wait.');
          } else {
            setError('Cannot reach backend. Try refreshing the page.');
          }
        });
    };
    tryFetch();
  }, []);

  const selectState = (id, name) => {
    setStateId(id); setStateName(name);
    setCityId(''); setCityName('');
    setZoneId(''); setZoneName('');
    setCities([]); setZones([]);
    onChangeRef.current({ state: name, city: '', zone: '', location: '' });
    if (!id) return;
    fetch(`${API}/location/cities?state_id=${id}`)
      .then(r => r.json())
      .then(data => setCities(dedup(data)))
      .catch(console.error);
  };

  const selectCity = (id, name) => {
    setCityId(id); setCityName(name);
    setZoneId(''); setZoneName('');
    setZones([]);
    onChangeRef.current({ state: stateName, city: name, zone: '', location: name });
    if (!id) return;
    fetch(`${API}/location/zones?city_id=${id}`)
      .then(r => r.json())
      .then(data => setZones(dedup(data)))
      .catch(console.error);
  };

  const selectZone = (id, name) => {
    setZoneId(id); setZoneName(name);
    onChangeRef.current({
      state: stateName, city: cityName, zone: name,
      location: name ? `${name}, ${cityName}` : cityName,
    });
  };

  // GPS auto-detect
  const handleGPS = () => {
    if (!navigator.geolocation) { setError('GPS not supported.'); return; }
    setGpsLoading(true); setError('');

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await res.json();
          const addr = data.address || {};
          const detectedState  = addr.state || '';
          const detectedCity   = addr.city || addr.town || addr.municipality || addr.county || '';
          const detectedSuburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || '';

          const norm = s => s.toLowerCase().trim();

          const mState = states.find(s =>
            norm(detectedState).includes(norm(s.name)) || norm(s.name).includes(norm(detectedState))
          );
          if (!mState) { setError(`State "${detectedState}" not found. Select manually.`); return; }

          setStateId(mState.id); setStateName(mState.name);
          const cityRes = await fetch(`${API}/location/cities?state_id=${mState.id}`);
          const cityData = dedup(await cityRes.json());
          setCities(cityData);

          const terms = [detectedCity, detectedSuburb].filter(Boolean).map(norm);
          const mCity = cityData.find(c => terms.some(t => t.includes(norm(c.name)) || norm(c.name).includes(t)));
          if (!mCity) { setError(`City not matched. Select district manually.`); return; }

          setCityId(mCity.id); setCityName(mCity.name);
          const zoneRes = await fetch(`${API}/location/zones?city_id=${mCity.id}`);
          const zoneData = dedup(await zoneRes.json());
          setZones(zoneData);

          const mZone = zoneData.find(z => terms.some(t => t.includes(norm(z.name)) || norm(z.name).includes(t)));
          if (mZone) {
            setZoneId(mZone.id); setZoneName(mZone.name);
            onChangeRef.current({ state: mState.name, city: mCity.name, zone: mZone.name, location: `${mZone.name}, ${mCity.name}` });
          } else {
            onChangeRef.current({ state: mState.name, city: mCity.name, zone: '', location: mCity.name });
            setError('Area not matched. Select zone manually.');
          }
        } catch {
          setError('Location lookup failed. Select manually.');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setError(err.code === 1 ? 'GPS access denied.' : 'Could not get location.');
        setGpsLoading(false);
      },
      { timeout: 12000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Location {required && <span className="text-red-500">*</span>}
        </label>
        <button type="button" onClick={handleGPS} disabled={gpsLoading}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition disabled:opacity-50">
          {gpsLoading ? <Loader size={12} className="animate-spin" /> : <Locate size={12} />}
          {gpsLoading ? 'Detecting...' : 'Auto-detect'}
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-amber-700 font-medium bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">State</p>
          <SearchableSelect options={states} value={stateId} onChange={selectState} placeholder="Select state" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">District</p>
          <SearchableSelect options={cities} value={cityId} onChange={selectCity}
            placeholder={stateId ? 'Select district' : 'Select state first'} disabled={!stateId} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Area / Zone</p>
          <SearchableSelect options={zones} value={zoneId} onChange={selectZone}
            placeholder={cityId ? 'Select area' : 'Select district first'} disabled={!cityId} />
        </div>
      </div>

      {cityName && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <MapPin size={11} className="text-blue-500" />
          {[zoneName, cityName, stateName].filter(Boolean).join(', ')}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
