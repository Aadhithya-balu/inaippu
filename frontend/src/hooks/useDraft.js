import { useState, useEffect, useCallback } from 'react';

const useDraft = (key, initial = {}) => {
  const storageKey = `draft_${key}`;

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : initial;
    } catch { return initial; }
  });

  const [hasDraft] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return false;
      return Object.values(JSON.parse(saved)).some(v => v && v !== '');
    } catch { return false; }
  });

  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasContent = Object.values(data).some(v => v && v !== '');
      if (hasContent) {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setSavedAt(new Date());
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [data, storageKey]);

  const update = useCallback((k, val) => setData(prev => ({ ...prev, [k]: val })), []);
  const updateAll = useCallback((obj) => setData(obj), []);
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setData(initial);
    setSavedAt(null);
  }, [storageKey]);

  return { data, update, updateAll, clearDraft, hasDraft, savedAt };
};

export default useDraft;
