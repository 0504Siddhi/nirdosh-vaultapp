import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../api/client';
import { FileText, CheckCircle, AlertTriangle, ChevronRight, Activity, ShieldCheck, Lock, Trash2 } from 'lucide-react';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // DPDP Post-Login Consent States
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);

  useEffect(() => {
    // Check if user has already given DPDP consent this session
    const hasConsented = sessionStorage.getItem('nirdosh_dpdp_consent');
    if (!hasConsented) {
      setShowConsentModal(true);
    }

    Promise.all([
      api.get('/documents'),
      api.get('/analysis'),
    ]).then(([docRes, analysisRes]) => {
      setDocs(docRes.data.documents || []);
      setAnalyses(analysisRes.data.analyses || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const latestAnalysis = analyses.length > 0 ? analyses[0] : null;
  const issues = latestAnalysis
    ? (latestAnalysis.summary?.conflictFieldsCount ?? 0)
    : 0;

  const handleConsentConfirm = () => {
    if (consent1 && consent2 && consent3) {
      sessionStorage.setItem('nirdosh_dpdp_consent', 'true');
      setShowConsentModal(false);
    }
  };

  function scoreColor(score: number) {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-saffron-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  }

  function scoreBg(score: number) {
    if (score >= 80) return 'bg-green-500/10 border-green-500/20';
    if (score >= 60) return 'bg-saffron-500/10 border-saffron-500/20';
    if (score >= 40) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  }

  return (
    <div className="pt-24 px-6 max-w-5xl mx-auto min-h-screen relative z-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-slate-500 mb-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h2 className="text-3xl font-bold">Welcome, {user?.name.split(' ')[0]}</h2>
        </div>
        <Link to="/upload" className="btn btn-primary">+ Upload Documents</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<FileText className="text-saffron-500" />} value={docs.length} label="Documents Uploaded" />
        <StatCard icon={<CheckCircle className="text-green-500" />} value={latestAnalysis?.summary?.consensusFieldsCount ?? '-'} label="Fields in Consensus" />
        <StatCard icon={<AlertTriangle className="text-red-500" />} value={latestAnalysis ? issues : '-'} label="Conflicts Found" />
        <StatCard icon={<Activity className="text-blue-500" />} value={analyses.length} label="Analyses Run" />
      </div>

      {/* Privacy notice */}
      <div className="p-4 rounded-xl bg-saffron-500/10 border border-saffron-500/20 flex gap-3 mb-8">
        <span className="text-saffron-400">🔒</span>
        <div>
          <strong className="text-saffron-400 text-sm block mb-1">Privacy Notice (Demo)</strong>
          <p className="text-xs text-slate-600">Use synthetic documents only — never upload real Aadhaar, PAN, or sensitive personal information. Documents are processed in-memory and auto-deleted after extraction.</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="card p-6">
          <div className="text-3xl mb-3">📁</div>
          <h3 className="text-lg font-bold mb-2">Upload Documents</h3>
          <p className="text-sm text-slate-500 mb-6">Upload Aadhaar, PAN, Voter ID, Driving Licence, Passport, Birth Certificate, or Marksheet for cross-document consistency checking.</p>
          <Link to="/upload" className="btn btn-primary px-4 py-2">Upload Now →</Link>
        </div>
        
        {/* Interactive DigiLocker Card */}
        <div className="card p-6 bg-white border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl">🏛️</div>
              <span className="text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">
                Simulated API
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">DigiLocker Integration</h3>
            <p className="text-sm text-slate-500 mb-6">Import authentic government-issued documents directly with one-click user authorization and secure consent.</p>
          </div>
          <button 
            onClick={() => setShowDigiLockerModal(true)}
            className="btn btn-secondary px-4 py-2 text-sm w-full flex items-center justify-center gap-2"
          >
            Connect DigiLocker →
          </button>
        </div>
      </div>

      {/* Analysis History */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold">Analysis History</h3>
        <Link to="/upload" className="text-sm text-saffron-500 hover:text-saffron-400 font-medium">
          New Analysis →
        </Link>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-slate-500">Loading...</div>
      ) : analyses.length === 0 ? (
        <div className="card">
          <EmptyState
            emoji="📊"
            title="No Analyses Yet"
            description="Upload at least 2 documents and run your first consensus analysis to see identity consistency results here."
            action={{ label: 'Upload Documents →', onClick: () => navigate('/upload') }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis: any) => {
            const analysisIssues = analysis.summary?.conflictFieldsCount ?? 0;
            const score = analysis.healthScore ?? 0;
            return (
              <Link
                key={analysis._id}
                to={`/report/${analysis._id}`}
                className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-saffron-500/30 transition-all"
              >
                {/* Score badge */}
                <div className={`w-16 h-16 rounded-xl border flex flex-col items-center justify-center shrink-0 ${scoreBg(score)}`}>
                  <span className={`text-2xl font-black ${scoreColor(score)}`}>{score}</span>
                  <span className="text-[9px] text-slate-500">/100</span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">
                      {analysis.documentIds?.length ?? 0} documents
                    </span>
                    {analysisIssues > 0
                      ? <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5">{analysisIssues} conflict{analysisIssues !== 1 ? 's' : ''}</span>
                      : <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2 py-0.5">✓ Consistent</span>
                    }
                    <span className="text-[10px] bg-slate-500/10 text-slate-500 rounded-full px-2 py-0.5">
                      {analysis.summary?.consensusFieldsCount ?? 0}/{analysis.summary?.comparableFieldsCount ?? 0} fields consistent
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(analysis.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* ── DPDP Post-Login Data Processing Consent Modal ── */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-saffron-500/20 text-saffron-400 flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base">Data Processing Consent</h3>
                <p className="text-xs text-slate-400">Please read and confirm before accessing your workspace</p>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-xs text-slate-300">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={consent1} 
                  onChange={(e) => setConsent1(e.target.checked)}
                  className="mt-0.5 rounded border-slate-600 text-saffron-500 focus:ring-saffron-500" 
                />
                <div>
                  <strong className="text-white block mb-0.5">Demo Environment Only</strong>
                  <span className="text-slate-400 leading-relaxed">I understand this is a demonstration application and I will only upload synthetic or sample documents — never real identity documents.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={consent2} 
                  onChange={(e) => setConsent2(e.target.checked)}
                  className="mt-0.5 rounded border-slate-600 text-saffron-500 focus:ring-saffron-500" 
                />
                <div>
                  <strong className="text-white block mb-0.5">Temporary In-Memory Processing</strong>
                  <span className="text-slate-400 leading-relaxed">I consent to my uploaded files being temporarily processed in-memory by the server for the purpose of AI-assisted data extraction and cross-document consistency analysis.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={consent3} 
                  onChange={(e) => setConsent3(e.target.checked)}
                  className="mt-0.5 rounded border-slate-600 text-saffron-500 focus:ring-saffron-500" 
                />
                <div>
                  <strong className="text-white block mb-0.5">No Permanent Storage</strong>
                  <span className="text-slate-400 leading-relaxed">I acknowledge that uploaded documents are not stored permanently on any server. They will be discarded after analysis and are not shared with any third party.</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mb-4 px-1">
              <span>Progress</span>
              <span className="font-bold text-saffron-400">{Number(consent1) + Number(consent2) + Number(consent3)}/3 confirmed</span>
            </div>

            <button
              onClick={handleConsentConfirm}
              disabled={!(consent1 && consent2 && consent3)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                consent1 && consent2 && consent3 
                  ? 'bg-saffron-500 hover:bg-saffron-600 text-white shadow-lg shadow-saffron-500/20 cursor-pointer' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
              }`}
            >
              Please confirm all 3 items above
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-3">Your consent is stored for this session and will reappear upon next login.</p>
          </div>
        </div>
      )}

      {/* DigiLocker Consent Simulation Modal */}
      {showDigiLockerModal && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                DL
              </div>
              <div>
                <h4 className="font-bold text-navy-950 text-base">DigiLocker Consent Gateway</h4>
                <p className="text-xs text-slate-500">Ministry of Electronics and Information Technology (MeitY)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              <strong>Nirdosh Vault</strong> is requesting secure, temporary access to fetch your verified digital documents for pre-submission identity consistency checking:
            </p>

            <div className="bg-slate-50 rounded-xl p-3 mb-6 space-y-2 text-xs text-slate-700 border border-slate-200/60">
              <div className="flex items-center gap-2">✅ Primary Demographic Details</div>
              <div className="flex items-center gap-2">✅ Tax Identification Document</div>
              <div className="flex items-center gap-2">✅ Birth Certificate</div>
            </div>

            <div className="bg-saffron-50 border border-saffron-500/20 rounded-xl p-3 mb-6 text-[11px] text-saffron-800">
              🔒 <strong>DPDP Act Compliance:</strong> Data is processed temporarily in-memory and auto-deleted immediately after analysis. No permanent storage.
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowDigiLockerModal(false)}
                className="btn btn-secondary flex-1 py-2.5 text-xs"
              >
                Deny
              </button>
              <button 
                onClick={() => {
                  setIsConnecting(true);
                  setTimeout(() => {
                    setIsConnecting(false);
                    setShowDigiLockerModal(false);
                    navigate('/upload');
                  }, 1200);
                }}
                disabled={isConnecting}
                className="btn btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-2"
              >
                {isConnecting ? 'Authenticating...' : 'Allow & Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="card p-6">
      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mb-4 shadow-sm">
        {icon}
      </div>
      <div className="text-3xl font-black mb-1">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}