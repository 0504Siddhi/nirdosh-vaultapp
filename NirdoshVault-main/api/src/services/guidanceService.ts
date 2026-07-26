import ruleData from '../data/correction-rules.json';
import { IFieldResult, IGuidanceItem } from '../models/store';
import type { CorrectionRule, GuideStatus } from '../types/nirdosh-vault';

const rules = ruleData.rules as CorrectionRule[];
const active = (rule: CorrectionRule) => rule.rule_status !== 'unverified' && (!rule.expires_for_review_on || new Date(rule.expires_for_review_on) >= new Date());

export function buildCorrectionKit(analysisId: string, result: IFieldResult, documentType?: string) {
  const base = { analysis_id: analysisId, field_result: result, legal_boundary: 'Final legal correctness and approval remain with the issuing authority.', data_retention: { raw_files_deleted_after_processing: true } };
  if (result.status === 'consistent' || result.status === 'not_comparable') return { ...base, guide_status: 'unsupported_rule' as GuideStatus, selected_rule_id: null, correction_guide: null };
  if (result.status === 'conflicting_evidence') return { ...base, guide_status: 'no_consensus' as GuideStatus, selected_rule_id: null, correction_guide: null, next_action: 'Verify original records, then choose a document to review.' };
  if (!documentType) return { ...base, guide_status: 'requires_user_input' as GuideStatus, selected_rule_id: null, correction_guide: null, next_action: 'Select the document you want to review. Majority evidence is not legal truth.' };
  
  // FIXED: Changed r.field to r.field_key to match the updated JSON schema structure
  const rule = rules.filter(active).filter(r => r.document_type === documentType && r.field_key === result.fieldKey && r.scenario === result.scenario).sort((a,b) => b.priority - a.priority)[0];
  
  if (!rule) return { ...base, guide_status: 'unsupported_rule' as GuideStatus, selected_rule_id: null, correction_guide: null, next_action: 'No verified guidance rule is available for this document, field, and scenario.' };
  if (rule.requires_user_input) return { ...base, guide_status: 'requires_user_input' as GuideStatus, selected_rule_id: rule.rule_id, correction_guide: null, next_action: 'This rule needs facts that cannot be inferred from the uploaded document.' };
  
  // FIXED: Mapped property names from the JSON schema (title -> title, citizen_message -> citizen_message, recommended_steps -> steps, etc.)
  return { 
    ...base, 
    guide_status: (rule.rule_status === 'authority-dependent' ? 'authority_dependent' : 'guide_available') as GuideStatus, 
    selected_rule_id: rule.rule_id, 
    correction_guide: { 
      title: rule.title, 
      citizen_message: rule.citizen_message, 
      authority: rule.authority, 
      steps: rule.recommended_steps, 
      supporting_document_categories: rule.supporting_document_categories, 
      disclaimer: rule.disclaimer 
    }, 
    official_evidence: rule.official_sources 
  };
}

export async function generateGuidance(fieldResults: IFieldResult[]): Promise<IGuidanceItem[]> {
  return fieldResults.filter(r => !['consistent', 'not_comparable'].includes(r.status)).map(result => ({ 
    fieldKey: result.fieldKey, 
    fieldLabel: result.label, 
    issueStatus: result.status, 
    explanation: result.explanation, 
    rules: [], 
    steps: ['Review the evidence and select a document to review before correction guidance is shown.'], 
    disclaimer: 'Nirdosh Vault does not determine legal truth or choose a correction target automatically.' 
  }));
}

