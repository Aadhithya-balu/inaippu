import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, Eye, ChevronDown, ChevronUp, Loader, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const FilePreview = ({ file, url, onRemove }) => {
  const isPdf = file?.type === 'application/pdf' || url?.endsWith('.pdf');
  return (
    <div className="relative group flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
      {isPdf ? (
        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
          <FileText size={20} />
        </div>
      ) : (
        <img src={url || URL.createObjectURL(file)} alt="preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{file?.name || url?.split('/').pop()}</p>
        {file?.size && <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>}
      </div>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 transition">
          <Eye size={16} />
        </a>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} className="p-1.5 text-slate-400 hover:text-red-500 transition">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

const DocumentUploader = ({ onUpload, label = 'Supporting Documents' }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [previousDocs, setPreviousDocs] = useState([]);
  const [showPrevious, setShowPrevious] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    api.get('/documents').then(({ data }) => setPreviousDocs(data)).catch(() => {});
  }, []);

  const validate = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP, and PDF files are allowed.';
    if (file.size > MAX_SIZE) return 'File exceeds 5MB limit.';
    return null;
  };

  const handleFiles = async (files) => {
    setError('');
    for (const file of Array.from(files)) {
      const err = validate(file);
      if (err) { setError(err); return; }

      setUploading(true);
      try {
        const base64 = await fileToBase64(file);
        const { data } = await api.post('/documents/upload', {
          base64, fileName: file.name, fileType: file.type, fileSize: file.size,
        });
        const newDoc = { ...data, _file: file };
        setUploadedDocs(prev => [...prev, newDoc]);
        onUpload?.(newDoc.file_url);
      } catch (err) {
        setError(err.response?.data?.error || 'Upload failed.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleClickZone = useCallback(() => inputRef.current?.click(), []);

  const handleSelectPrevious = useCallback((doc) => {
    if (uploadedDocs.find(d => d.id === doc.id)) return;
    setUploadedDocs(prev => [...prev, doc]);
    onUpload?.(doc.file_url);
  }, [uploadedDocs, onUpload]);

  const handleRemove = useCallback((id) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== id));
  }, []);

  const makeRemoveHandler = useCallback((id) => () => handleRemove(id), [handleRemove]);

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickZone}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition
          ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-blue-600">
            <Loader size={28} className="animate-spin" />
            <p className="text-sm font-semibold">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Upload size={28} />
            <p className="text-sm font-semibold text-slate-600">Drop files here or click to browse</p>
            <p className="text-xs">JPEG, PNG, WebP, PDF · Max 5MB each</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 font-semibold ml-1">{error}</p>}

      {uploadedDocs.length > 0 && (
        <div className="space-y-2">
          {uploadedDocs.map(doc => (
            <div key={doc.id} className="relative">
              <FilePreview file={doc._file} url={doc.file_url} onRemove={makeRemoveHandler(doc.id)} />
              <div className="absolute top-3 right-10">
                <CheckCircle size={14} className="text-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {previousDocs.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button type="button" onClick={() => setShowPrevious(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
            <span className="flex items-center gap-2">
              <FileText size={15} />
              Use a previously uploaded document ({previousDocs.length})
            </span>
            {showPrevious ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showPrevious && (
            <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
              {previousDocs.map(doc => {
                const selected = !!uploadedDocs.find(d => d.id === doc.id);
                return (
                  <button key={doc.id} type="button" onClick={() => handleSelectPrevious(doc)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition
                      ${selected ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'}`}>
                    {doc.file_type === 'application/pdf'
                      ? <FileText size={18} className="text-red-400 shrink-0" />
                      : <Image size={18} className="text-blue-400 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{doc.file_name}</p>
                      <p className="text-[10px] text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    {selected && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
