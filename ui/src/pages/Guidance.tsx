import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  Clock,
  IndianRupee,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import api from '../api/client';

export default function Guidance() {
  const { id } = useParams<{ id: string }>();

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Analysis ID is missing.');
      setLoading(false);
      return;
    }

    api
      .get(`/analysis/${id}`)
      .then((response) => {
        setAnalysis(response.data);
      })
      .catch((err) => {
        console.error('Guidance loading failed:', err);
        setError(
          err?.response?.data?.error ||
            'Unable to load correction guidance.',
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const conflictStatuses = [
    'mismatch',
    'outlier',
    'outlier_detected',
    'possible_variant',
    'conflict',
    'conflicting_evidence',
    'no_consensus',
    'incomplete_date_conflict',
    'extraction_uncertain',
  ];

  const conflicts = Array.isArray(analysis?.fieldResults)
    ? analysis.fieldResults.filter((field: any) => {
        return (
          conflictStatuses.includes(field.status) ||
          (Array.isArray(field.outliers) &&
            field.outliers.length > 0) ||
          (Array.isArray(field.groups) &&
            field.groups.length > 1)
        );
      })
    : [];

  const ruleDatabase: Record<string, any> = {
    date_of_birth: {
      authority:
        'UIDAI, Registrar of Births and Deaths, or relevant issuing authority',
      form:
        'Date of Birth Correction or Document Update Application',
      fee: 'As prescribed by the authority',
      timeline: 'Usually 7-90 working days',
      docs: [
        'Birth Certificate or accepted proof of date of birth',
        'Original document containing the mismatch',
        'Identity proof',
        'Correction application',
      ],
      steps: [
        'Compare the detected values and identify the document containing the likely incorrect date.',
        'Contact the authority that originally issued that document.',
        'Request its current date-of-birth correction procedure.',
        'Submit the correction application with accepted supporting documents.',
        'Keep the acknowledgement receipt and track the request.',
        'Verify the corrected document after issuance.',
      ],
    },

    full_name: {
      authority:
        'Authority that issued the document containing the incorrect name',
      form: 'Name Correction Application',
      fee: 'As prescribed by the authority',
      timeline: 'Usually 15-60 working days',
      docs: [
        'Document containing the correct name',
        'Document containing the mismatch',
        'Identity proof',
        'Declaration, affidavit, or Gazette record only when required',
      ],
      steps: [
        'Determine whether the difference is a spelling variation or a legal name change.',
        'Identify the document containing the likely incorrect value.',
        'Contact the issuing authority.',
        'Submit its official name-correction application.',
        'Provide an affidavit or Gazette record only when the authority requires it.',
        'Verify the corrected document before updating dependent records.',
      ],
    },

    address: {
      authority:
        'UIDAI, Income Tax Department, or relevant issuing authority',
      form: 'Address Update Application',
      fee: 'As prescribed by the authority',
      timeline: 'Usually 7-30 working days',
      docs: [
        'Accepted proof of address',
        'Original document containing the incorrect address',
        'Identity proof',
        'Correction application',
      ],
      steps: [
        'Confirm the currently valid address using accepted proof.',
        'Identify the document containing the outdated or incorrect address.',
        'Contact the authority that issued that document.',
        'Submit the address-update application with valid proof.',
        'Keep the acknowledgement number.',
        'Verify the corrected address after processing.',
      ],
    },
  };

  const normalizeFieldKey = (value: string) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/^_+|_+$/g, '');

  const getRule = (conflict: any) => {
    const key = normalizeFieldKey(
      conflict.fieldKey || conflict.field || conflict.label,
    );

    if (key.includes('date_of_birth') || key === 'dob') {
      return ruleDatabase.date_of_birth;
    }

    if (
      key.includes('full_name') ||
      key.includes('applicant_name') ||
      key === 'name'
    ) {
      return ruleDatabase.full_name;
    }

    if (key.includes('address')) {
      return ruleDatabase.address;
    }

    return {
      authority:
        'Authority that originally issued the document containing the incorrect value',
      form: 'Official Document Correction Application',
      fee: 'As prescribed by the issuing authority',
      timeline: 'Usually 7-30 working days',
      docs: [
        'Original document containing the mismatch',
        'Strong supporting document containing the correct value',
        'Identity proof',
        'Written correction application',
        'Affidavit only if officially required',
      ],
      steps: [
        'Review the conflicting values.',
        'Identify the strongest supporting record.',
        'Determine which document likely contains the incorrect value.',
        'Contact the authority that issued that document.',
        'Submit the official correction application.',
        'Keep the acknowledgement and verify the corrected document.',
      ],
    };
  };

  const getEvidence = (conflict: any) => {
    const evidence: Array<{
      document: string;
      value: string;
      type: 'supporting' | 'outlier' | 'other';
    }> = [];

    if (Array.isArray(conflict.supportingDocs)) {
      conflict.supportingDocs.forEach((document: any) => {
        evidence.push({
          document:
            document.docTitle ||
            document.documentTitle ||
            document.docType ||
            'Supporting document',
          value: String(
            document.value ??
              document.rawValue ??
              document.normalizedValue ??
              'Not available',
          ),
          type: 'supporting',
        });
      });
    }

    if (Array.isArray(conflict.outliers)) {
      conflict.outliers.forEach((document: any) => {
        evidence.push({
          document:
            document.docTitle ||
            document.documentTitle ||
            document.docType ||
            'Differing document',
          value: String(
            document.value ??
              document.rawValue ??
              document.normalizedValue ??
              'Not available',
          ),
          type: 'outlier',
        });
      });
    }

    if (Array.isArray(conflict.groups)) {
      conflict.groups.forEach((group: any) => {
        const documents = group.docs || group.documents || [];

        documents.forEach((document: any) => {
          evidence.push({
            document:
              document.docTitle ||
              document.documentTitle ||
              document.docType ||
              'Document',
            value: String(group.value ?? 'Not available'),
            type: 'other',
          });
        });
      });
    }

    if (
      evidence.length === 0 &&
      conflict.consensusValue !== undefined
    ) {
      evidence.push({
        document: 'Consensus value',
        value: String(conflict.consensusValue),
        type: 'supporting',
      });
    }

    return evidence;
  };

  if (loading) {
    return (
      <div className="pt-32 text-center text-slate-500">
        Loading official correction guidelines...
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-28 px-6 max-w-3xl mx-auto">
        <div className="card p-8 text-center">
          <AlertTriangle
            className="mx-auto text-red-500 mb-3"
            size={40}
          />

          <h2 className="text-xl font-bold mb-2">
            Guidance Could Not Be Loaded
          </h2>

          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto min-h-screen relative z-10 pb-20">
      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
        <Link
          to={`/report/${id}`}
          className="text-slate-500 hover:text-saffron-600 flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={16} />
          Back to Report
        </Link>

        <span className="text-slate-300">/</span>

        <span className="text-saffron-600 font-bold uppercase tracking-wider text-xs bg-saffron-50 px-2.5 py-1 rounded-md border border-saffron-200">
          Correction Kit &amp; SOPs
        </span>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Official Correction Guidance Kit
        </h2>

        <p className="text-slate-500 text-sm">
          Detected conflicts: {conflicts.length}
        </p>
      </div>

      {conflicts.length === 0 ? (
        <div className="card p-8 text-center bg-white border-slate-200">
          <CheckCircle
            className="mx-auto text-green-500 mb-3"
            size={40}
          />

          <h3 className="font-bold text-lg mb-1">
            No Conflicts Detected
          </h3>
        </div>
      ) : (
        <div className="space-y-6">
          {conflicts.map((conflict: any, index: number) => {
            const rule = getRule(conflict);
            const evidence = getEvidence(conflict);
            const label =
              conflict.label ||
              conflict.field ||
              conflict.fieldKey ||
              'Document Field';

            return (
              <div
                key={`${conflict.fieldKey || index}-${index}`}
                className="card p-6 bg-white border-slate-200 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Conflict Resolution Required
                    </span>

                    <h3 className="text-xl font-bold text-navy-950 mt-2">
                      {label} Correction
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Status: <strong>{conflict.status}</strong>
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Governing body:{' '}
                      <strong>{rule.authority}</strong>
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1 sm:justify-end">
                      <Clock size={14} />
                      {rule.timeline}
                    </div>

                    <div className="text-xs font-bold text-saffron-600 mt-1 flex items-center gap-1 sm:justify-end">
                      <IndianRupee size={12} />
                      {rule.fee}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200 text-xs">
                  <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-3">
                    Conflicting Evidence Found
                  </div>

                  {evidence.length > 0 ? (
                    evidence.map((item, evidenceIndex) => (
                      <div
                        key={evidenceIndex}
                        className="flex flex-col sm:flex-row sm:justify-between gap-2 py-2 border-b border-slate-200 last:border-0"
                      >
                        <span className="text-slate-600 font-medium">
                          {item.document}
                        </span>

                        <span
                          className={`font-bold px-2 py-1 rounded border ${
                            item.type === 'outlier'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-white text-navy-950 border-slate-200'
                          }`}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">
                      Conflict detected, but detailed document values
                      were not included.
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Recommended Correction Procedure
                  </h4>

                  <div className="space-y-3">
                    {rule.steps.map(
                      (step: string, stepIndex: number) => (
                        <div
                          key={stepIndex}
                          className="flex items-start gap-3 text-xs text-slate-700"
                        >
                          <span className="w-5 h-5 rounded-full bg-saffron-500/10 text-saffron-600 font-bold flex items-center justify-center shrink-0">
                            {stepIndex + 1}
                          </span>

                          <p>{step}</p>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mb-6 text-xs">
                  <div className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <FileText size={14} />
                    Supporting Documents That May Be Required
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rule.docs.map(
                      (document: string, documentIndex: number) => (
                        <li
                          key={documentIndex}
                          className="flex items-start gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          {document}
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    Form reference: <strong>{rule.form}</strong>
                  </span>

                  <Link
                    to={`/centres/${id}`}
                    className="btn btn-secondary text-xs py-2 px-4 flex items-center justify-center gap-2"
                  >
                    <MapPin size={14} />
                    Find Nearest Assistance Centre
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
