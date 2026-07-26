import { IDocument, IFieldResult } from '../models/store';
import { canonicalFieldKey, normalizeField } from './normalizationService';
import type { ConfidenceLabel, FieldStatus, DocumentSpecificField, ConsensusSummary } from '../types/nirdosh-vault';

interface Entry { docId: string; docTitle: string; docType: string; value: string; normalized: string; incomplete: boolean; }

export const FIELD_WEIGHTS: Record<string, number> = {};

function scenarioFor(field: string, values: Entry[]): string {
  if (field === 'date_of_birth') {
    const years = new Set(values.map(v => v.normalized.slice(0, 4)));
    const incomplete = values.some(v => v.incomplete);
    if (incomplete && years.size === 1) return 'year_only_same_year';
    if (years.size > 1) return 'year_difference';
    return 'different_full_date';
  }
  if (field === 'full_name') {
    const initials = values.some(v => /(^|\s)[a-z](\s|$)/i.test(v.value.replace(/[.]/g, ' ')));
    return initials ? 'possible_initial_or_order_variant' : 'name_difference_standard';
  }
  return `${field}_difference`;
}

function confidence(status: FieldStatus, support: number, total: number): ConfidenceLabel {
  if (status === 'conflicting_evidence') return 'no_consensus';
  if (status === 'possible_variant' || status === 'extraction_uncertain') return 'review';
  if (support === total) return 'high';
  return 'medium';
}

function validField(field: any): boolean {
  return Boolean(field?.value && field.normalized && !field.invalidReason && (field.confidence ?? 0) >= 0.6);
}

export interface AuditReportResponse {
  summary: ConsensusSummary;
  fieldResults: IFieldResult[];
  documentSpecificFields: DocumentSpecificField[];
}

export function runConsensusEngine(documents: IDocument[]): AuditReportResponse {
  const byField = new Map<string, Entry[]>();
  
  // 1. Data Ingestion & Normalization
  for (const doc of documents) {
    for (const field of doc.extractedFields || []) {
      const key = canonicalFieldKey(field.fieldKey);
      if (!validField(field)) continue; 
      
      const normalizedResult = normalizeField(key, field.value);
      const normalized = normalizedResult.normalized;
      if (!normalized) continue;
      
      const list = byField.get(key) || [];
      list.push({ 
        docId: doc._id, 
        docTitle: doc.title, 
        docType: doc.docType, 
        value: field.value, 
        normalized, 
        incomplete: Boolean(field.incomplete || normalizedResult.incomplete) 
      });
      byField.set(key, list);
    }
  }

  const comparableFieldResults: IFieldResult[] = [];
  const documentSpecificFields: DocumentSpecificField[] = [];

  // 2. The Readiness Router & Consensus Matrix
  for (const [fieldKey, entries] of byField) {
    const label = fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    // Existence Check (Metadata)
    if (entries.length < 2) {
      documentSpecificFields.push({
        fieldName: label,
        docId: entries[0].docId,
        docType: entries[0].docType,
        value: entries[0].value
      });
      continue;
    }

    // Consistency Check (Consensus)
    const groups = [...entries.reduce((m, e) => m.set(e.normalized, [...(m.get(e.normalized) || []), e]), new Map<string, Entry[]>()).values()].sort((a,b) => b.length - a.length);
    const largest = groups[0];
    const hasYearOnly = fieldKey === 'date_of_birth' && entries.some(e => e.incomplete);
    
    if (hasYearOnly && new Set(entries.map(e => e.normalized.slice(0, 4))).size === 1) {
      comparableFieldResults.push({ fieldKey, label, status: 'possible_variant', confidence: 'review', confidenceLabel: 'Review - year-only date evidence', scenario: 'year_only_same_year', evidence: entries, explanation: 'The year agrees, but at least one document contains only a year of birth. This is incomplete evidence, not an exact full-date match.', needsManualVerification: true });
      continue;
    }
    
    if (groups.length === 1) {
      comparableFieldResults.push({ fieldKey, label, status: 'consistent', confidence: 'high', confidenceLabel: 'High - all comparable documents agree', scenario: 'exact_normalized_match', consensusValue: largest[0].value, supportingDocs: largest.map(e => ({ docId:e.docId, docTitle:e.docTitle, value:e.value, docType:e.docType })), explanation: 'All comparable uploaded documents agree under deterministic normalization.', needsManualVerification: false });
      continue;
    }
    
    if (largest.length > entries.length / 2) {
      const outliers = entries.filter(e => e.normalized !== largest[0].normalized);
      const scenario = scenarioFor(fieldKey, entries);
      const status: FieldStatus = scenario === 'possible_initial_or_order_variant' ? 'possible_variant' : 'outlier_detected';
      comparableFieldResults.push({ fieldKey, label, status, confidence: confidence(status, largest.length, entries.length), confidenceLabel: status === 'possible_variant' ? 'Review - possible name variant' : 'Medium - majority evidence, review recommended', scenario, consensusValue: largest[0].value, supportingDocs: largest.map(e => ({ docId:e.docId, docTitle:e.docTitle, value:e.value, docType:e.docType })), outliers: outliers.map(e => ({ docId:e.docId, docTitle:e.docTitle, value:e.value, docType:e.docType })), likelyOutlierDocumentIds: outliers.map(e => e.docId), explanation: `${largest.length} of ${entries.length} comparable documents agree. The differing document appears inconsistent based on uploaded evidence; this is not a legal determination.`, needsManualVerification: true });
      continue;
    }
    
    comparableFieldResults.push({ fieldKey, label, status: 'conflicting_evidence', confidence: 'no_consensus', confidenceLabel: 'No Consensus - no reliable majority', scenario: scenarioFor(fieldKey, entries), groups: groups.map(g => ({ value:g[0].value, docs:g.map(e => ({docId:e.docId, docTitle:e.docTitle, docType:e.docType})) })), explanation: 'Evidence is split with no reliable majority. No correction target has been selected.', needsManualVerification: true });
  }

  // 3. Quantitative Summary Generation
  const totalComparable = comparableFieldResults.length;
  const totalConsensus = comparableFieldResults.filter(f => f.status === 'consistent').length;
  const totalConflicts = comparableFieldResults.filter(f => f.status !== 'consistent').length;
  return {
    summary: {
      totalDocuments: documents.length,
      comparableFieldsCount: totalComparable,
      consensusFieldsCount: totalConsensus,
      conflictFieldsCount: totalConflicts
    },
    fieldResults: comparableFieldResults,
    documentSpecificFields: documentSpecificFields
  };
}