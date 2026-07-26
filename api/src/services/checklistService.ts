import { IChecklistItem } from '../models/store';
import type { DocumentSpecificField } from '../types/nirdosh-vault';

const SCHEMES: Omit<IChecklistItem, 'readiness' | 'disclaimer'>[] = [
  { id: 'NMMSS', schemeName: 'National Means-cum-Merit Scholarship Scheme', ministry: 'Education authority', category: 'education', description: 'Document-readiness checklist only.', requiredDocTypes: ['aadhaar', 'school_leaving_certificate'], requiredDocuments: ['Aadhaar', 'School certificate'], applicationUrl: 'https://scholarships.gov.in/' },
  { id: 'PM_KISAN', schemeName: 'PM-KISAN', ministry: 'Ministry of Agriculture & Farmers Welfare', category: 'agriculture', description: 'Document-readiness checklist only.', requiredDocTypes: ['aadhaar'], requiredDocuments: ['Aadhaar', 'Bank record', 'Land record'], applicationUrl: 'https://pmkisan.gov.in/' },
];

export function generateChecklist(
  uploadedDocTypes: string[],
  documentSpecificFields?: DocumentSpecificField[] // <-- Added parameter to resolve TypeScript error
): IChecklistItem[] {
  const uploaded = uploadedDocTypes.map(t => t.toLowerCase());
  
  // Optional: Extract a list of available metadata field names for future existence checks
  const availableMetadata = documentSpecificFields?.map(f => f.fieldName.toLowerCase()) || [];

  return SCHEMES.map(scheme => {
    // 1. Check if core identity documents are present
    const hasCoreDocs = scheme.requiredDocTypes.every(t => uploaded.includes(t));
    
    // 2. You can expand this logic later to check `availableMetadata` against specific scheme requirements
    
    return { 
      ...scheme, 
      readiness: hasCoreDocs ? 'uploaded' : 'not_uploaded', 
      disclaimer: 'This is preparation guidance, not an eligibility determination. Verify current requirements on the official portal.' 
    };
  });
}