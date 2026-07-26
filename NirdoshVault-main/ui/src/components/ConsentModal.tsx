import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface ConsentModalProps {
  onAccept: () => void;
}

export default function ConsentModal({ onAccept }: ConsentModalProps) {
  const [checked, setChecked] = useState([false, false, false]);

  const allChecked = checked.every(Boolean);

  const toggle = (i: number) => {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const handleAccept = () => {
    if (!allChecked) return;
    localStorage.setItem('nirdosh_consent_given', 'true');
    onAccept();
  };

  const CONSENTS = [
    {
      title: 'Demo Environment Only',
      body: 'I understand this is a demonstration application and I will only upload synthetic or sample documents — never real Aadhaar, PAN, or any sensitive personal identity documents.',
    },
    {
      title: 'Temporary In-Memory Processing',
      body: 'I consent to my uploaded files being temporarily processed in-memory by the server for the purpose of AI-assisted data extraction and cross-document consistency analysis.',
    },
    {
      title: 'No Permanent Storage',
      body: 'I acknowledge that uploaded documents are not stored permanently on any server. They will be discarded after analysis and are not shared with any third party.',
    },
  ];

  return (
    <div
      id="consent-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/10 p-8 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #1e1e2e 0%, #16162a 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-saffron-500/15 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} className="text-saffron-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Data Processing Consent</h2>
            <p className="text-sm text-slate-400">Please read and confirm before uploading</p>
          </div>
        </div>

        {/* Consent Items */}
        <div className="space-y-4 mb-8">
          {CONSENTS.map((c, i) => (
            <button
              key={i}
              id={`consent-item-${i}`}
              onClick={() => toggle(i)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex gap-3 cursor-pointer ${
                checked[i]
                  ? 'border-saffron-500/40 bg-saffron-500/8'
                  : 'border-white/10 bg-white/3 hover:border-white/20'
              }`}
            >
              {/* Checkbox */}
              <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-all ${
                checked[i] ? 'bg-saffron-500 border-saffron-500' : 'border-slate-500'
              }`}>
                {checked[i] && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-white mb-1">{c.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{c.body}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-saffron-500 transition-all duration-500"
              style={{ width: `${(checked.filter(Boolean).length / 3) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0">{checked.filter(Boolean).length}/3 confirmed</span>
        </div>

        {/* Actions */}
        <button
          id="consent-accept-btn"
          onClick={handleAccept}
          disabled={!allChecked}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
            allChecked
              ? 'bg-saffron-500 text-white hover:bg-saffron-400 shadow-lg shadow-saffron-500/20'
              : 'bg-white/5 text-slate-500 cursor-not-allowed'
          }`}
        >
          {allChecked ? '✓ I Agree & Proceed to Upload' : 'Please confirm all 3 items above'}
        </button>

        <p className="text-center text-[10px] text-slate-600 mt-4">
          Your consent is stored locally in your browser and won't be asked again this session.
        </p>
      </div>
    </div>
  );
}
