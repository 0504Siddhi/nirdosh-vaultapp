import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, MapPin, CheckCircle, Clock, IndianRupee, FileText } from 'lucide-react';

export default function Guidance() {
  const { analysisId } = useParams();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/analysis/${analysisId}`)
      .then(res => setAnalysis(res.data.analysis))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [analysisId]);

  if (loading) {
    return <div className="pt-32 text-center text-slate-500">Loading official correction guidelines...</div>;
  }

  // Research-backed rule database for official identity documents (UIDAI & PAN)
  const ruleDatabase: Record<string, { authority: string; form: string; fee: string; timeline: string; docs: string[]; steps: string[] }> = {
    'Date Of Birth': {
      authority: 'UIDAI (Aadhaar Regulation 19) / Registrar of Births & Deaths',
      form: 'Aadhaar Enrolment / Update Form',
      fee: '₹50 (Inclusive of GST)',
      timeline: '7 to 90 working days',
      docs: ['Original Birth Certificate (BC)', 'Passport / School Leaving Certificate (SLC)', 'PAN Card (if matching target DOB)'],
      steps: [
        'Visit your nearest authorized Aadhaar Seva Kendra (ASK) or Registrar office.',
        'Fill out the Aadhaar Correction/Update Form specifying the target Date of Birth.',
        'Submit original self-attested copy of your Birth Certificate or valid Proof of Birth (PoB).',
        'Complete biometric authentication and collect the Update Request Number (URN) slip.'
      ]
    },
    'Address': {
      authority: 'Income Tax Department (Protean/UTIITSL) & UIDAI',
      form: 'PAN Change Request Form / Aadhaar Address Update',
      fee: '₹110 (Domestic dispatch) / ₹50 (Aadhaar update)',
      timeline: '15 to 20 working days',
      docs: ['Utility Bill (Electricity/Water not older than 3 months)', 'Voter ID or Passport', 'Bank Statement with current address'],
      steps: [
        'Log into the Protean (NSDL) or UTIITSL portal for PAN address synchronization.',
        'Submit supporting address proof matching your primary verified document.',
        'Alternatively, update Aadhaar address online via SSUP portal using valid Address Proof.',
        'Track status using the acknowledgment number provided upon submission.'
      ]
    },
    'Full Name': {
      authority: 'UIDAI & Department of Revenue',
      form: 'Joint Declaration Form / Deed Poll (Gazette Notification if major change)',
      fee: '₹50 - ₹100 depending on authority',
      timeline: '30 to 60 working days',
      docs: ['Gazette Notification (mandatory for spelling corrections/surname changes)', 'PAN Card', 'Educational Marksheet'],
      steps: [
        'Publish name change in State/Central Official Gazette if spelling difference is substantial.',
        'Submit Aadhaar correction request attaching Gazette certificate and supporting school records.',
        'Synchronize PAN details once Aadhaar is successfully updated.'
      ]
    }
  };

  // Smart fallback rule for custom or unrecognized documents (e.g., School Leaving Certificate, Marksheets)
  const getRuleForConflict = (conflict: any) => {
    if (ruleDatabase[conflict.field]) {
      return ruleDatabase[conflict.field];
    }
    return {
      authority: 'Issuing School Authority / Educational Board / Registrar',
      form: 'Institution Application / Correction Affidavit',
      fee: 'Nominal institutional processing fee',
      timeline: '7 to 15 working days',
      docs: ['Original School Leaving Certificate / Marksheet', 'Principal / Headmaster Application Letter', 'Identity Proof (Aadhaar/PAN)'],
      steps: [
        'Visit the issuing school or educational board office where the certificate was originally generated.',
        'Submit a formal written application addressed to the Principal or Registrar requesting the correction.',
        'Attach supporting official school admission registers or birth records verifying the correct details.',
        'Collect the revised and re-stamped certificate upon institutional approval.'
      ]
    };
  };

  const conflicts = analysis?.fieldComparisons?.filter((f: any) => f.status === 'conflict' || f.status === 'outlier') || [];

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto min-h-screen relative z-10 pb-20">
      {/* Clean Breadcrumb Header */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
        <Link to={`/report/${analysisId}`} className="text-slate-500 hover:text-saffron-600 flex items-center gap-1 font-medium">
          <ArrowLeft size={16} /> Back to Report
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-saffron-600 font-bold uppercase tracking-wider text-xs bg-saffron-50 px-2.5 py-1 rounded-md border border-saffron-200">
          Correction Kit & SOPs
        </span>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Official Correction Guidance Kit</h2>
        <p className="text-slate-500 text-sm">
          Actionable steps based on verified regulations from UIDAI, Income Tax Department, and issuing authorities to resolve detected document conflicts.
        </p>
      </div>

      {conflicts.length === 0 ? (
        <div className="card p-8 text-center bg-white border-slate-200">
          <CheckCircle className="mx-auto text-green-500 mb-3" size={40} />
          <h3 className="font-bold text-lg mb-1">No Conflicts Detected</h3>
          <p className="text-xs text-slate-500">Your documents are fully consistent. No correction steps are required.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {conflicts.map((conflict: any, idx: number) => {
            const rule = getRuleForConflict(conflict);

            return (
              <div key={idx} className="card p-6 bg-white border-slate-200 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Conflict Resolution Required
                    </span>
                    <h3 className="text-xl font-bold text-navy-950 mt-1">{conflict.field} Correction</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Governing Body: <strong>{rule.authority}</strong></p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1 justify-end">
                      <Clock size={14} className="text-slate-400" /> {rule.timeline}
                    </div>
                    <div className="text-xs font-bold text-saffron-600 mt-1 flex items-center gap-0.5 justify-end">
                      <IndianRupee size={12} /> {rule.fee}
                    </div>
                  </div>
                </div>

                {/* Evidence breakdown */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200/60 text-xs space-y-2">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Conflicting Evidence Found:</div>
                  {Object.entries(conflict.values || {}).map(([docTitle, val]: [string, any], i: number) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-slate-200/40 last:border-0">
                      <span className="text-slate-600 font-medium">{docTitle}:</span>
                      <span className="font-bold text-navy-950 bg-white px-2 py-0.5 rounded border border-slate-200">{String(val)}</span>
                    </div>
                  ))}
                </div>

                {/* Step-by-Step Action Pathway */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Official Standard Operating Procedure (SOP)</h4>
                  <div className="space-y-2.5">
                    {rule.steps.map((stepText: string, sIdx: number) => (
                      <div key={sIdx} className="flex items-start gap-3 text-xs text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-saffron-500/10 text-saffron-600 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                          {sIdx + 1}
                        </span>
                        <p className="leading-relaxed">{stepText}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required Documents */}
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mb-6 text-xs">
                  <div className="font-bold text-blue-900 mb-2 flex items-center gap-1.5">
                    <FileText size={14} className="text-blue-600" /> Required Supporting Documents
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-blue-950">
                    {rule.docs.map((doc: string, dIdx: number) => (
                      <li key={dIdx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {doc}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer action to find nearby help */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">Form Reference: <strong>{rule.form}</strong></span>
                  <Link to={`/centres/${analysisId}`} className="btn btn-secondary text-xs py-2 px-4 flex items-center gap-1.5">
                    <MapPin size={14} /> Find Nearest Enrolment Centre →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}