import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../api/client';
import { X, FileText, Loader2, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

interface SampleDoc {
  filename: string;
  label: string;
  docType: string;
}

interface SampleSet {
  id: string;
  name: string;
  description: string;
  scenario: string;
  documents: SampleDoc[];
}

interface SampleDocsModalProps {
  onClose: () => void;
}

export default function SampleDocsModal({ onClose }: SampleDocsModalProps) {
  const navigate = useNavigate();
  const { token, setAuth } = useAuthStore();
  const [sets, setSets] = useState<SampleSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSet, setLoadingSet] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/samples')
      .then(res => setSets(res.data.sets || []))
      .catch(() => setError('Failed to load sample sets'))
      .finally(() => setLoading(false));
  }, []);

  const handleLoadSet = async (setId: string) => {
    setLoadingSet(setId);
    setError('');

    try {
      // If not logged in, create a guest account first
      if (!token) {
        const guestEmail = `guest-${Date.now()}@demo.nirdosh.in`;
        const guestPassword = `guest-${Date.now()}`;
        const guestName = 'Guest User';

        const { data } = await api.post('/auth/signup', {
          name: guestName,
          email: guestEmail,
          password: guestPassword,
        });
        setAuth(data.user, data.token);
      }

      // Load the sample set
      const { data } = await api.post('/samples/load', { setId });

      // Navigate to the analysis report
      if (data.analysis?._id) {
        onClose();
        navigate(`/report/${data.analysis._id}`);
      }
    } catch (err: any) {
      console.error('Failed to load sample set:', err);
      setError(err.response?.data?.error || 'Failed to load sample documents');
    } finally {
      setLoadingSet(null);
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-slate-200 relative animate-in">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
              <Sparkles size={18} className="text-saffron-500" />
              Try Sample Documents
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">See the Consensus Engine in action with preloaded documents</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {!loading && sets.length === 0 && !error && (
            <div className="text-center py-12 text-slate-400 text-sm">
              No sample sets available yet.
            </div>
          )}

          {sets.map(set => (
            <div
              key={set.id}
              className="border border-slate-200 rounded-xl p-5 hover:border-saffron-500/40 hover:bg-saffron-500/[0.02] transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-bold text-navy-950">{set.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{set.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {set.documents.map(doc => (
                  <div
                    key={doc.filename}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600"
                  >
                    <FileText size={12} className="text-slate-400" />
                    {doc.label}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                  {set.scenario}
                </div>
                <button
                  onClick={() => handleLoadSet(set.id)}
                  disabled={loadingSet !== null}
                  className="btn btn-primary px-4 py-2 text-xs"
                >
                  {loadingSet === set.id ? (
                    <><Loader2 size={14} className="animate-spin" /> Loading...</>
                  ) : (
                    <>Load & Analyze <ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <p className="text-[10px] text-slate-400 text-center">
            Sample documents use synthetic data only. No real personal information is used.
          </p>
        </div>
      </div>
    </div>
  );
}
