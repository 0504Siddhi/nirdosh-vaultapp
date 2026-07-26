import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Lock, CheckCircle2, Upload, FileSearch, GitCompare, ClipboardCheck, MapPin, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Landing() {
  // Interactive state for the hero preview card demo toggle
  const [activeTab, setActiveTab] = useState<'mismatch' | 'consistent'>('mismatch');

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50">
      {/* Navbar */}
      <nav className="h-20 px-6 max-w-7xl mx-auto w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5 font-extrabold text-xl text-navy-950">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-saffron-500 to-green-600 flex items-center justify-center text-xs font-black text-white tracking-tight shadow-sm">
            NV
          </div>
          <span>Nirdosh Vault</span>
        </div>
        <Link to="/auth" className="btn btn-secondary">Sign In</Link>
      </nav>

      <main className="flex-1 relative z-10 px-6">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto pt-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column — Text & CTA (7 cols) */}
            <div className="lg:col-span-7 flex flex-col pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-saffron-500/10 border border-saffron-500/25 text-saffron-600 mb-6 tracking-wider uppercase w-fit">
                PRE-SUBMISSION IDENTITY CONSISTENCY CHECK
              </div>
              
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black leading-[1.1] mb-6 text-navy-950">
                Catch document conflicts<br/>before they become<br/>application problems.
              </h1>
              
              <p className="text-lg text-slate-600 max-w-xl mb-8 leading-relaxed">
                Nirdosh Vault compares identity fields across multiple uploaded documents, explains conflicting evidence, and guides you to an appropriate correction path before official submission.
              </p>

              {/* Primary CTA & Trust Subtext */}
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
                <Link to="/auth" className="btn btn-primary px-8 py-4 text-base flex items-center gap-2 shadow-lg shadow-saffron-500/20">
                  Check My Documents <ArrowRight size={18} />
                </Link>
              </div>

              {/* Trust Badges under CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80 max-w-xl">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Lock size={14} className="text-green-600 shrink-0" />
                  <span>Zero server retention (In-memory only)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldAlert size={14} className="text-saffron-600 shrink-0" />
                  <span>DPDP Act Aligned</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                  <span>Consensus Engine (No AI guesswork)</span>
                </div>
              </div>
            </div>

            {/* Right Column — Interactive Conflict Preview Card (5 cols) */}
            <div className="lg:col-span-5 w-full">
              <div className="card p-6 bg-white border-slate-200 shadow-xl shadow-slate-200/50 relative">
                <div className="absolute -top-3 -right-3 bg-navy-950 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  Live Engine Preview
                </div>

                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simulated Analysis</span>
                  <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                    <button 
                      onClick={() => setActiveTab('mismatch')}
                      className={`px-3 py-1 rounded-md transition-all ${activeTab === 'mismatch' ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      Conflict Found
                    </button>
                    <button 
                      onClick={() => setActiveTab('consistent')}
                      className={`px-3 py-1 rounded-md transition-all ${activeTab === 'consistent' ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      Consistent
                    </button>
                  </div>
                </div>

                {activeTab === 'mismatch' ? (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                      <div className="text-xs">
                        <strong className="text-red-900 block mb-0.5">Name Mismatch Detected</strong>
                        <span className="text-red-700">Aadhaar reads <strong>"Rajesh Kumar"</strong> but PAN reads <strong>"Rajesh K."</strong></span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span>Aadhaar Card:</span>
                        <span className="font-semibold text-navy-950">Rajesh Kumar</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>PAN Card:</span>
                        <span className="font-semibold text-red-600">Rajesh K. (Outlier)</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Birth Certificate:</span>
                        <span className="font-semibold text-navy-950">Rajesh Kumar</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-saffron-50 border border-saffron-500/20 text-xs text-saffron-900">
                      💡 <strong>Correction Kit Generated:</strong> View official Income Tax Department Name Update SOP & form links instantly.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                      <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={18} />
                      <div className="text-xs">
                        <strong className="text-green-900 block mb-0.5">Full Consensus Established</strong>
                        <span className="text-green-700">All 4 core identity fields match across uploaded documents. Ready for secure submission!</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span>Full Name:</span>
                        <span className="font-semibold text-green-600">Verified Consistent</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Date of Birth:</span>
                        <span className="font-semibold text-green-600">Verified Consistent</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Gender / Address:</span>
                        <span className="font-semibold text-green-600">Verified Consistent</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                      🚀 <strong>Ready to Apply:</strong> Zero discrepancy risk detected for welfare scheme submission.
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Workflow Steps Section */}
        <div className="max-w-7xl mx-auto py-12 border-t border-slate-200">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-navy-950 mb-3">How Nirdosh Vault Works</h2>
            <p className="text-sm text-slate-500">A multi-step consensus protocol designed to ensure your application never gets rejected due to clerical cross-document mismatches.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <WorkflowCard step={1} icon={<Upload size={20} />} title="Upload" desc="Upload 2–5 synthetic or redacted ID documents" color="saffron" />
            <WorkflowCard step={2} icon={<FileSearch size={20} />} title="Extraction" desc="OCR extracts text and validates document layout" color="blue" />
            <WorkflowCard step={3} icon={<GitCompare size={20} />} title="Consensus" desc="Every document is compared against every other" color="green" />
            <WorkflowCard step={4} icon={<ClipboardCheck size={20} />} title="Guidance" desc="Get rule-based correction kits and official steps" color="blue" />
            <WorkflowCard step={5} icon={<MapPin size={20} />} title="Help Nearby" desc="Locate official Seva Kendras or local offices" color="saffron" />
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto pb-20 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
            <StatCard value="4–7%" label="Welfare leakage from document mismatches (NITI Aayog)" color="text-saffron-500" />
            <StatCard value="56+" label="Ministries using DBT — all require consistent identity" color="text-green-600" />
            <StatCard value="₹500+" label="Typical cost just to begin one document correction cycle" color="text-navy-950" />
          </div>
        </div>
      </main>
    </div>
  );
}

function WorkflowCard({ step, icon, title, desc, color }: {
  step: number; icon: React.ReactNode; title: string; desc: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    saffron: 'bg-saffron-500/10 text-saffron-600 border-saffron-500/20',
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    green: 'bg-green-500/10 text-green-600 border-green-500/20',
  };
  const badgeStyle = colorMap[color] || colorMap.saffron;

  return (
    <div className="card p-5 bg-white border-slate-200 flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${badgeStyle}`}>
            {icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step {step}</span>
        </div>
        <h3 className="font-bold text-base text-navy-950 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: string, label: string, color: string }) {
  return (
    <div className="card p-8 flex flex-col items-center justify-center text-center bg-white border-slate-200 shadow-sm">
      <div className={`text-4xl md:text-5xl font-black mb-3 ${color}`}>{value}</div>
      <div className="text-sm text-slate-500 leading-relaxed">{label}</div>
    </div>
  );
}