import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { CheckCircle2, AlertTriangle, BookOpen, ClipboardList, ExternalLink } from 'lucide-react';
import ExportPDF from '../components/ExportPDF';
import type { ConsensusSummary, DocumentSpecificField, IFieldResult } from '../types/nirdosh-vault';

interface ReportData {
  summary: ConsensusSummary;
  fieldResults: IFieldResult[];
  documentSpecificFields: DocumentSpecificField[];
  documentIds?: string[];
  checklist?: any[];
  _id?: string;
}

export default function Report() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fields');

  useEffect(() => {
    if (!id) {
      // If no ID, fetch the latest analysis
      api.get('/analysis').then(res => {
        const analyses = res.data.analyses;
        if (analyses?.length > 0) {
          navigate(`/report/${analyses[0]._id}`, { replace: true });
        } else {
          setLoading(false);
        }
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      api.get(`/analysis/${id}`)
        .then(res => setAnalysis(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  if (loading) return <div className="pt-32 text-center text-slate-500">Loading report...</div>;
  
  if (!analysis) return (
    <div className="pt-32 px-6 max-w-4xl mx-auto text-center">
      <div className="card p-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">No Analysis Found</h2>
        <p className="text-slate-500 mb-6">You haven't run any document consensus checks yet.</p>
        <Link to="/upload" className="btn btn-primary">Go to Upload</Link>
      </div>
    </div>
  );

  const { summary, fieldResults, documentSpecificFields } = analysis;
  const issues = summary.conflictFieldsCount;
  const hasIssues = issues > 0;
  // Use summary.totalDocuments for counts to ensure safety if documentIds array is missing
  const docCount = analysis.documentIds?.length || summary.totalDocuments || 0;

  return (
    <div className="pt-24 px-6 max-w-5xl mx-auto min-h-screen relative z-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-saffron-500 bg-saffron-500/10 border border-saffron-500/20 mb-3">
            📊 Consensus Report
          </div>
          <h2 className="text-3xl font-bold mb-2">Document Consistency Report</h2>
          <p className="text-slate-500">Cross-document consistency only — not legal correctness or scheme eligibility.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ExportPDF analysis={analysis} />
          {hasIssues && (
            <Link to={`/guidance/${analysis._id}`} className="btn btn-primary">
              <BookOpen size={16} /> Correction Kit
            </Link>
          )}
        </div>
      </div>

      <div className={`card p-8 mb-8 border-2 ${hasIssues ? 'border-saffron-500/30 bg-saffron-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center text-3xl ${hasIssues ? 'bg-saffron-500/20 text-saffron-500' : 'bg-green-500/20 text-green-500'}`}>
            {hasIssues ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-2xl font-bold mb-1">
              {hasIssues ? `${issues} Identity Conflict${issues > 1 ? 's' : ''} Detected — Review Required` : 'Documents Consistent — No Conflicts Detected'}
            </h3>
            <p className="text-slate-600 text-sm mb-2">
              Analysed <strong>{docCount} documents</strong> across <strong>{summary.comparableFieldsCount} comparable fields</strong>. 
              <span className="text-green-400 font-semibold ml-1">{summary.consensusFieldsCount} fields in consensus</span>
              {issues > 0 && <span className="text-saffron-400 font-semibold ml-1">, {issues} conflicts</span>}.
            </p>
            <p className="text-xs text-slate-500">A strict majority requires more than half of usable values. This report does not determine legal correctness or scheme eligibility.</p>
          </div>
        </div>
      </div>

      {/* Health Score Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-8 overflow-x-auto">
        <TabButton active={activeTab === 'fields'} onClick={() => setActiveTab('fields')}>Field-by-Field Results</TabButton>
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>Consensus Profile</TabButton>
        <TabButton active={activeTab === 'checklist'} onClick={() => setActiveTab('checklist')}>
          <span className="flex items-center gap-1.5"><ClipboardList size={14} /> Document Checklist</span>
        </TabButton>
      </div>

      {activeTab === 'fields' && (
        <div className="space-y-4">
          {fieldResults.map((res: any, idx: number) => (
            <FieldRow key={idx} result={res} />
          ))}
          
          {/* New Document Specific Fields Grid */}
          {documentSpecificFields && documentSpecificFields.length > 0 && (
            <div className="mt-10 mb-8 border-t border-slate-200 pt-8">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider">
                  Document-Specific Attributes
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                  Non-Comparable Metadata
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {documentSpecificFields.map((item) => (
                  <div key={`${item.docId}-${item.fieldName}`} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{item.fieldName}</span>
                    <span className="text-sm font-bold text-slate-900 block mt-1 truncate" title={item.value}>{item.value}</span>
                    <div className="mt-3 inline-flex items-center text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                      📄 {item.docType.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <ConsensusProfile fieldResults={fieldResults} documentCount={docCount} />
      )}

      {activeTab === 'checklist' && (
        <ChecklistTab checklist={analysis.checklist ?? []} />
      )}
    </div>
  );
}

function ConsensusProfile({ fieldResults, documentCount }: { fieldResults: any[]; documentCount: number }) {
  const included = fieldResults.filter((r: any) => r.status === 'consistent' || r.status === 'outlier_detected' || r.status === 'possible_variant');
  const conflicts = fieldResults.filter((r: any) => r.status === 'conflicting_evidence' || r.status === 'incomplete_date_conflict').length;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[['Documents analysed', documentCount], ['Consensus fields', included.length], ['Conflicting fields', conflicts]].map(([label, value]) => (
          <div key={String(label)} className="card p-4 text-center">
            <div className="text-2xl font-black">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>
      {included.length === 0 ? (
        <div className="card p-10 text-center border-slate-200">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-2xl">⚖️</div>
          <h3 className="text-xl font-bold mb-2">No reliable consensus profile was created</h3>
          <p className="text-slate-600 max-w-2xl mx-auto">The current evidence does not support a safe majority. Add another independent document or confirm uncertain extracted fields to strengthen the evidence.</p>
          <div className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">The engine responsibly withheld a result</div>
        </div>
      ) : (
        <div className="card p-6">
          <h3 className="text-xl font-bold mb-5">Consensus Identity Profile</h3>
          {included.map((res:any, i:number)=>(
            <div key={i} className="py-4 border-b last:border-0 border-slate-100">
              <div className="text-sm text-slate-500">{res.label}</div>
              <div className="font-bold text-lg">{res.consensusValue || 'Value requires review'}</div>
              <div className="text-xs text-slate-500 mt-1">Supported by {res.supportingDocs?.length || 0} document(s)</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-saffron-500 text-saffron-400' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function FieldRow({ result }: { result: any }) {
  const getStatusBadge = () => {
    switch(result.status) {
      case 'consistent':
      case 'consensus_established': return <span className="badge bg-green-500/10 text-green-400 border border-green-500/20">✓ Consensus Established</span>;
      case 'outlier_detected':
      case 'possible_variant':
      case 'outliers_found': return <span className="badge bg-saffron-500/10 text-saffron-400 border border-saffron-500/20">⚠ Outlier Detected</span>;
      case 'conflicting_evidence':
      case 'no_consensus': return <span className="badge bg-red-500/10 text-red-500 border border-red-500/20">Conflicting evidence · no strict majority</span>;
      case 'incomplete_date_conflict': return <span className="badge bg-red-500/10 text-red-400 border border-red-500/20">📅 Incomplete Date Conflict</span>;
      default: return null;
    }
  };

  const getConfIcon = (conf: string) => {
    if (conf === 'high') return '🟢';
    if (conf === 'medium') return '🟡';
    if (conf === 'limited') return '🟠';
    return '🔴';
  };

  return (
    <div className="card p-6 transition-colors hover:border-slate-300">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
        <div>
          <div className="font-bold text-lg mb-1">{result.label}</div>
          <div className="font-mono text-xs text-slate-500">{result.fieldKey}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-white text-slate-600 border border-slate-200" title={result.confidenceLabel}>
            {getConfIcon(result.confidence)} {result.confidenceLabel}
          </span>
          {getStatusBadge()}
        </div>
      </div>

      <div className="mb-6">
        {result.status === 'consistent' && (
          <>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-3">{result.consensusValue}</div>
            <div className="flex flex-wrap gap-2">
              {result.supportingDocs.map((d: any, i: number) => <DocChip key={i} title={d.docTitle} type="good" />)}
            </div>
          </>
        )}

        {(result.status === 'outlier_detected' || result.status === 'possible_variant') && (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Consensus Value</div>
              <div className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-2">{result.consensusValue}</div>
              <div className="flex flex-wrap gap-2">
                {result.supportingDocs.map((d: any, i: number) => <DocChip key={i} title={d.docTitle} type="good" />)}
              </div>
            </div>
            <div>
              <div className="text-xs text-saffron-400 mb-1">Likely Outlier(s)</div>
              <div className="flex flex-wrap gap-2">
                {result.outliers.map((o: any, i: number) => <DocChip key={i} title={`${o.docTitle}: "${o.value}"`} type="warn" />)}
              </div>
            </div>
          </div>
        )}

        {result.status === 'conflicting_evidence' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.groups.map((g: any, i: number) => (
              <div key={i} className={`p-4 rounded-xl border ${i === 0 ? 'bg-blue-500/5 border-blue-500/20' : 'bg-purple-500/5 border-purple-500/20'}`}>
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${i === 0 ? 'text-blue-400' : 'text-purple-400'}`}>
                  Group {i === 0 ? 'A' : 'B'} — {g.docs.length} doc{g.docs.length > 1 ? 's' : ''}
                </div>
                <div className="text-lg font-bold mb-3">"{g.value}"</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.docs.map((d: any, j: number) => <span key={j} className="text-xs px-2 py-1 bg-white rounded border border-slate-200">{d.docTitle}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {result.status === 'incomplete_date_conflict' && (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Complete date documents</div>
              <div className="flex flex-wrap gap-2">
                {result.completeEntries.map((d: any, i: number) => <DocChip key={i} title={`${d.docTitle}: "${d.value}"`} type="good" icon="📅" />)}
              </div>
            </div>
            <div>
              <div className="text-xs text-red-400 mb-1">Year-only documents (Declared DOB)</div>
              <div className="flex flex-wrap gap-2">
                {result.incompleteEntries.map((d: any, i: number) => <DocChip key={i} title={`${d.docTitle}: "${d.value}"`} type="danger" icon="📅" />)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-4 border border-slate-100">
        <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Why this result?</div>
        <p className="text-sm text-slate-600 leading-relaxed">{result.explanation}</p>
      </div>
    </div>
  );
}

function DocChip({ title, type, icon = '✓' }: { title: string, type: 'good'|'warn'|'danger', icon?: string }) {
  const styles = {
    good: 'bg-green-500/10 text-green-400 border-green-500/20',
    warn: 'bg-saffron-500/10 text-saffron-400 border-saffron-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20'
  };
  return (
    <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${styles[type]} flex items-center gap-1.5`}>
      <span>{icon}</span> {title}
    </div>
  );
}

// ─── Checklist Tab ──────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  financial:  { label: 'Financial Aid',  emoji: '💰', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  housing:    { label: 'Housing',        emoji: '🏠', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  health:     { label: 'Healthcare',     emoji: '🏥', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  identity:   { label: 'Digital Identity', emoji: '🪪', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  education:  { label: 'Education',      emoji: '🎓', color: 'text-saffron-400 bg-saffron-500/10 border-saffron-500/20' },
  agriculture:{ label: 'Agriculture',    emoji: '🌾', color: 'text-lime-400 bg-lime-500/10 border-lime-500/20' },
};

function ChecklistTab({ checklist }: { checklist: any[] }) {
  const ready = checklist.filter((s: any) => s.readiness === 'uploaded');
  const needsDocuments = checklist.filter((s: any) => s.readiness !== 'uploaded');

  if (checklist.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-xl font-bold mb-2">No document checklist available</h3>
        <p className="text-slate-500">Run an analysis first to review document preparation requirements.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="card p-6 mb-6 border-green-500/20 bg-green-500/[0.02]">
        <div className="flex items-start gap-4">
          <div className="text-3xl shrink-0">📋</div>
          <div>
            <h3 className="text-xl font-bold mb-1">Government Document Checklist</h3>
            <p className="text-sm text-slate-500">
              Based on the document types uploaded, here are preparation checklists you can review before applying.
            </p>
            <p className="text-xs text-slate-600 mt-2">
              This checklist does not assess eligibility. Verify income, age, landholding and all scheme-specific conditions on the official portal.
            </p>
          </div>
        </div>
      </div>

      {/* Eligible schemes */}
      {ready.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-green-400 font-bold text-sm uppercase tracking-wide">Required Document Types Uploaded</span>
            <span className="text-xs text-slate-500">({ready.length} checklist{ready.length !== 1 ? 's' : ''})</span>
          </div>
          <div className="space-y-4">
            {ready.map((scheme: any) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        </div>
      )}

      {/* Ineligible schemes */}
      {needsDocuments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-slate-500 font-bold text-sm uppercase tracking-wide">Additional Documents Required</span>
            <span className="text-xs text-slate-600">({needsDocuments.length} checklist{needsDocuments.length !== 1 ? 's' : ''})</span>
          </div>
          <div className="space-y-3 opacity-60">
            {needsDocuments.map((scheme: any) => (
              <SchemeCard key={scheme.id} scheme={scheme} dimmed />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SchemeCard({ scheme }: { scheme: any; dimmed?: boolean }) {
  const cat = CATEGORY_META[scheme.category] ?? { label: scheme.category, emoji: '📌', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };

  return (
    <div className={`card p-5 transition-all ${scheme.readiness === 'uploaded' ? 'border-green-500/20' : 'border-white/5'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cat.color}`}>
              {cat.emoji} {cat.label}
            </span>
            {scheme.eligible && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-500/10 text-green-400 border border-green-500/20">
                ✓ Document set complete
              </span>
            )}
            {scheme.formName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-slate-400 border border-white/10">
                📄 {scheme.formName}
              </span>
            )}
          </div>
          <h4 className="text-base font-bold mb-1">{scheme.schemeName}</h4>
          <p className="text-[10px] text-slate-500 font-medium mb-2 uppercase tracking-wide">{scheme.ministry}</p>
          <p className="text-sm text-slate-400 leading-relaxed mb-3">{scheme.description}</p>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Required Documents: </span>
            <span className="text-xs text-slate-400">{scheme.requiredDocuments.join(' · ')}</span>
          </div>
        </div>
        <a
          href={scheme.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            scheme.eligible
              ? 'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25'
              : 'bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10'
          }`}
        >
          Open official portal <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}