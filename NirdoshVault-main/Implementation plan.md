# Implementation Plan

This implementation plan describes how to build Nirdosh Vault from scratch around the Consensus Identity Engine defined in the README.

## 1. Architecture Decision

Nirdosh Vault does not designate Aadhaar, a user-selected document, or any other document as ground truth. It verifies *cross-document consistency*, not legal correctness or scheme eligibility.

Final decision:

- Treat every uploaded identity document as peer evidence.
- Extract, normalize, and compare the same field across every uploaded document.
- Group equal normalized values and establish a consensus value only when one group has a strict majority of documents containing that field.
- Flag documents outside that majority as likely outliers; never assert that they are legally wrong.
- When there is no strict majority (including a 2-vs-2 split), return `no_consensus` and route the field to manual verification.
- Treat a year-only DOB versus a full DOB in that year as `incomplete_date_conflict`, not a match.
- Use deterministic rules for comparisons and outcomes; use Qdrant only for citations and Gemini only for extraction and plain-language explanations.

All correction guidance is advisory, tied to a versioned official source, and carries the disclaimer: “Draft for review — verify with the relevant authority before notarization or submission.”

## 2. Build Order

### Phase 1: Repository Scaffold

Create this structure:

```text
nirdosh-vault/
|-- api/
|   |-- src/
|   |   |-- app.ts
|   |   |-- server.ts
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- crypto/
|   |   |-- jobs/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- validators/
|   |   `-- utils/
|   |-- package.json
|   `-- tsconfig.json
|-- worker/
|   |-- app/
|   |   |-- main.py
|   |   |-- extraction/
|   |   |-- quality/
|   |   |-- embeddings/
|   |   |-- rag/
|   |   |-- rules/
|   |   |-- consensus/
|   |   |-- translation/
|   |   `-- security/
|   |-- requirements.txt
|   `-- Dockerfile
|-- ui/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- pages/
|   |   |-- state/
|   |   |-- i18n/
|   |   `-- styles/
|   |-- package.json
|   `-- vite.config.ts
|-- docker-compose.yml
|-- README.md
`-- Implementation plan.md
```

Add Docker Compose services:

- MongoDB
- Redis
- Qdrant
- MinIO
- API
- Worker
- UI

### Phase 2: Authentication

Implement:

```text
POST /api/v1/auth/signup
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

Models:

```ts
User {
  name: string;
  email: string;
  password: string;
  roles: Array<'user' | 'admin'>;
  languagePreference: string;
}
```

Requirements:

- Hash password with bcrypt.
- JWT signed with `JWT_SECRET`.
- JWT payload contains `sub`.
- Middleware loads user and attaches `req.user`.
- Add role middleware for admin routes.

Tests:

- Signup success.
- Duplicate email fails.
- Login success.
- Wrong password fails.
- Missing/invalid JWT fails.

### Phase 3: Security Foundation

Implement envelope encryption.

Services:

```text
api/src/crypto/encryptionService.ts
api/src/crypto/hashAnchorService.ts
api/src/services/storageService.ts
api/src/services/auditLogService.ts
```

Rules:

- Generate one random data encryption key per document.
- Encrypt files with AES-256-GCM before storage.
- Encrypt extracted text, field values, reports, recommendations, and draft declarations.
- Wrap the data key with master key or KMS.
- Compute HMAC anchors for plaintext-sensitive values.

Document anchors:

```text
ciphertextSha256 = SHA256(encrypted_file_bytes)
plaintextHmacSha256 = HMAC-SHA256(HMAC_PEPPER, plaintext_file_bytes)
```

Field anchors:

```text
valueHmac = HMAC-SHA256(HMAC_PEPPER, userId + documentId + fieldKey + normalizedValue)
```

### Phase 4: Data Models

Create these MongoDB models:

```ts
Document {
  userId: ObjectId;
  kind: 'identity_document' | 'supporting_document';
  status: 'uploaded' | 'processing' | 'ready' | 'failed' | 'archived';
  title: string;
  applicationType?: string;
  originalFile: {
    bucket: string;
    key: string;
    encrypted: true;
    contentType: string;
    size: number;
  };
  encryption: {
    dekEncrypted: string;
    algorithm: 'AES-256-GCM';
    keyVersion: string;
  };
  anchors: {
    ciphertextSha256: string;
    plaintextHmacSha256: string;
    merkleRoot?: string;
  };
}
```

```ts
DocumentField {
  userId: ObjectId;
  documentId: ObjectId;
  source: 'identity_document' | 'supporting_document';
  fieldKey: string;
  labelEncrypted: string;
  valueRawEncrypted: string;
  valueNormalizedEncrypted: string;
  valueHmac: string;
  page?: number;
  confidence: number;
  vectorId?: string;
}
```

```ts
ComparisonResult {
  userId: ObjectId;
  analyzedDocumentIds: ObjectId[];
  status: 'consensus_established' | 'outliers_found' | 'no_consensus' | 'needs_review';
  summary: {
    totalFieldsChecked: number;
    outlierCount: number;
    missingFieldCount: number;
    noConsensusFieldCount: number;
  };
  fieldResults: Array<FieldConsensusResult>;
}
```

```ts
ConsensusProfile {
  userId: ObjectId;
  analyzedDocumentIds: ObjectId[];
  fields: Array<{
    fieldKey: string;
    consensusValueEncrypted?: string;
    agreement: { supportingDocumentCount: number; documentsWithValueCount: number };
    status: 'consensus_established' | 'no_consensus' | 'incomplete_date_conflict' | 'needs_review';
    supportingFieldIds: ObjectId[];
    conflictingFieldIds: ObjectId[];
    evidenceGroups: Array<{ valueHmac: string; fieldIds: ObjectId[] }>;
  }>;
}
```

```ts
Rule {
  ruleId: string;
  authority: string;
  documentType: string;
  field: string;
  trigger: string;
  condition: string;
  action: string;
  requiredDocuments: string[];
  severity: 'low' | 'medium' | 'high';
  humanReview: boolean;
  sourceUrl?: string;
  version: string;
  active: boolean;
}
```

```ts
DraftDeclaration {
  userId: ObjectId;
  comparisonResultId: ObjectId;
  affectedDocumentIds: ObjectId[];
  selectedIssueIds: ObjectId[];
  language: string;
  format: 'text' | 'pdf';
  status: 'draft' | 'finalized';
  declarationEncrypted: string;
  pdfFile?: EncryptedFileRef;
  anchors: {
    declarationHmacSha256: string;
    sourceComparisonHmacSha256: string;
  };
}
```

### Phase 5: Input Quality Gate

Implement OpenCV checks before extraction:

- Blur detection.
- Brightness and contrast.
- Resolution.
- Orientation.
- Cropped document detection when possible.
- File type and file size validation.

Result:

```json
{
  "status": "pass",
  "blurScore": 0.91,
  "brightness": "acceptable",
  "orientation": "upright",
  "warnings": []
}
```

If quality is poor, allow upload but mark extraction confidence lower or ask user to re-upload.

### Phase 6: Document Extraction

Use Gemini 3.5 Flash multimodal for document and layout extraction.

Required prompt behavior:

- Return strict JSON only.
- Include field key, label, value, page, confidence, and evidence text.
- Do not infer missing identity facts.
- Use `needs_review` when uncertain.

Validate all outputs using Zod in API and Pydantic in worker.

Example schema:

```json
{
  "documentType": "aadhaar",
  "fields": [
    {
      "fieldKey": "full_name",
      "label": "Name",
      "value": "Nirdosh Kumar",
      "type": "person_name",
      "page": 1,
      "confidence": 0.94,
      "evidenceText": "Name: Nirdosh Kumar"
    }
  ],
  "needsReview": false
}
```

Use one config constant:

```ts
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
```

### Phase 7: Normalization

Create deterministic normalizers:

```text
nameNormalizer
dobNormalizer
genderNormalizer
addressNormalizer
phoneNormalizer
emailNormalizer
idNumberNormalizer
```

Rules:

- Normalize case and whitespace.
- Normalize Unicode.
- Normalize dates into ISO where possible.
- Normalize phone numbers.
- Preserve official display values.
- Do not use fuzzy matching to accept different values.

Name policy:

- Case differences are allowed.
- Extra spaces are allowed.
- Minor spelling differences are mismatches unless an official alias or correction rule applies.
- Initials are not automatically expanded or treated as equal to a full name; retain them as distinct evidence unless an official alias rule applies.

### Phase 8: Rule Database

Store rules in versioned JSON first. Move to SQL later if needed.

Seed rule categories:

1. Aadhaar correction rules.
2. PAN correction rules.
3. Birth certificate correction rules.
4. Application/scholarship correction rules.
5. Human review rules.

Aadhaar rule examples:

- Name can be corrected through official update channels with proof of identity.
- DOB correction may be limited and can require proof of date of birth.
- Gender can be updated but should be routed carefully.
- Address correction requires proof of address.
- Mobile/email update may require OTP or biometric workflow.
- Biometric updates follow different handling.
- Regional language update can be supported.

PAN rule examples:

- Name correction requires proof and official form/workflow.
- DOB correction requires proof of DOB.
- Father/mother name correction requires supporting documents.
- Address/contact correction requires relevant proof.

Birth certificate rule examples:

- Normal registration and delayed registration are different workflows.
- Child name insertion may be allowed later.
- Clerical errors and substantive changes require different evidence.
- DOB changes are legally sensitive and should trigger review.
- Parent detail changes require strong supporting documents.

### Phase 9: Qdrant RAG Evidence

Create Qdrant collections:

```text
user_document_evidence
correction_rules_evidence
```

Embedding model:

```text
sentence-transformers/all-MiniLM-L6-v2
```

Rules:

- Store vectors for chunks, labels, rule text, and evidence.
- Do not store raw PII in metadata.
- Always filter by `userId` for user documents.
- Do not use Qdrant as executable rule storage.

Metadata:

```json
{
  "userId": "user_id",
  "documentId": "document_id",
  "fieldId": "field_id",
  "source": "user_document",
  "fieldKey": "dob"
}
```

### Phase 10: Document Upload and Analysis Workflow

Endpoints:

```text
POST /api/v1/documents
GET  /api/v1/documents
POST /api/v1/documents/analyze
GET  /api/v1/analysis/:id
```

Flow:

1. User uploads one or more in-scope documents (Aadhaar, PAN, Birth Certificate, School Leaving Certificate, or Marksheet).
2. Run the quality gate, encrypt and temporarily store each original file, then extract and schema-validate fields.
3. Normalize each extracted value while retaining its original display value, page, evidence text, and extraction confidence.
4. Compare every document against every other document for each shared field.
5. Run the consensus engine and persist its field results, source documents, and deterministic decision trace.
6. Retrieve relevant official correction guidance only for outliers or unresolved conflicts.
7. Generate a plain-language report from the locked result; display documents as evidence, never as legal truth.
8. Delete temporary originals and extraction artefacts according to the retention policy, then audit the analysis.

### Phase 11: Pairwise Field Comparison

For every field key present in at least two ready documents:

1. Select fields with the same canonical `fieldKey`.
2. Decrypt normalized values only in memory.
3. Compare values deterministically; do not use fuzzy matching to turn different values into matches.
4. Record all agreeing and disagreeing document pairs, together with evidence references.
5. Mark missing fields separately from a mismatch.
6. For DOB, distinguish exact match, exact conflict, and `incomplete_date_conflict` (year-only versus a full date in the same year).

### Phase 12: Consensus Identity Engine

Run after every successful extraction and whenever a document is removed. For each field:

1. Group documents by the same normalized value.
2. Count the documents in each group, excluding documents where that field is absent or extraction requires review.
3. If one group contains more than half of the documents with a usable value, emit `consensus_established` with that value and its real agreement count.
4. Mark fields in every other group as `likely_outlier`; explain that the system found inconsistent evidence, not a legal error.
5. If no group has a strict majority, emit `no_consensus`; do not choose a value, flag an outlier, or recommend changing any document.
6. If the DOB rule above applies, emit `incomplete_date_conflict` and require verification of the underlying record.

Confidence is categorical and must include the agreement count; it is never a fabricated percentage:

```text
high:   consensus with 4+ supporting documents
medium: consensus with 3 supporting documents
limited: consensus with 2 supporting documents
insufficient: no strict majority, incomplete-date conflict, or too little usable evidence
```

Example result:

```json
{
  "fieldKey": "full_name",
  "status": "consensus_established",
  "consensusValue": "Sanjay Patil",
  "supportingDocuments": ["Aadhaar", "PAN", "Passport", "School Leaving Certificate"],
  "likelyOutliers": [{ "document": "Birth Certificate", "value": "Sanjay Paatil" }],
  "confidence": "high (4 of 5 documents agree)",
  "needsManualVerification": false
}
```

### Phase 13: Explanation Agent

Gemini explanation input must include:

- Locked deterministic decision.
- Retrieved evidence.
- Rule ids.
- Confidence label.
- Human-review status.

Gemini must not decide identity truth.

Output schema:

```json
{
  "summary": "Inconsistent name values found across your documents.",
  "whyItMatters": "Applications may be rejected when identity fields differ.",
  "recommendedAction": "Four of five documents support ‘Sanjay Patil’; verify the Birth Certificate record with the issuing authority before seeking a correction.",
  "evidenceUsed": ["Aadhaar page 1", "PAN page 1", "Birth Certificate page 1"],
  "disclaimer": "Draft for review — verify with the relevant authority before notarization or submission.",
  "needsHumanReview": false
}
```

### Phase 14: Bhashini Translation

Backend files:

```text
api/src/services/translation/translationProvider.ts
api/src/services/translation/bhashiniProvider.ts
api/src/services/translation/translationCache.ts
api/src/services/translation/languageRegistry.ts
```

Endpoints:

```text
GET  /api/v1/languages
POST /api/v1/user/language
POST /api/v1/translate
POST /api/v1/translate/batch
```

Implement:

- Configurable Bhashini pipeline.
- Batch translation.
- Translation cache.
- Retries and timeout.
- Safe fallback.
- No PII logging.

Important:

- Translate UI text, explanations, rules, and draft-declaration boilerplate.
- Preserve names, IDs, dates, and official values.
- Support bilingual draft declarations when possible.

### Phase 15: Correction Guidance and Draft Declaration

Endpoints:

```text
POST /api/v1/declarations/generate
GET  /api/v1/declarations/:id
POST /api/v1/declarations/:id/finalize
GET  /api/v1/declarations/:id/download
```

Generation flow:

1. Load comparison result.
2. Verify ownership.
3. Load selected outlier or unresolved-conflict issues.
4. Decrypt only required values in memory.
5. Build declaration facts JSON.
6. Retrieve relevant correction rules.
7. Generate a strict JSON draft declaration only if the selected, versioned rule explicitly supports that path; otherwise return advisory guidance and a supporting-documents checklist.
8. Validate required facts are present.
9. Translate with Bhashini if requested.
10. Render PDF if requested.
11. Encrypt the stored draft declaration and PDF.
12. Hash anchor the draft declaration.
13. Audit `declaration.generated`.

Required sections:

- Title.
- Deponent details.
- Document references.
- Error description.
- Reported consensus or conflicting evidence, clearly labeled as non-legal.
- Purpose of correction.
- Supporting documents.
- Declaration.
- Verification.
- Date/place/signature/notary placeholders.
- Mandatory disclaimer: “Draft for review — verify with the relevant authority before notarization or submission.”

### Phase 16: DigiLocker Provider Interface

Prototype:

- Use manual upload.
- Add UI language that says official DigiLocker integration is future/optional.

Provider interface:

```ts
interface OfficialDocumentProvider {
  requestConsent(userId: string): Promise<ConsentSession>;
  fetchDocuments(consentToken: string): Promise<OfficialDocument[]>;
}
```

Do not claim live DigiLocker integration without credentials and approval.

### Phase 17: Frontend

Pages:

- Auth page.
- Language selection page.
- Dashboard.
- Document upload page.
- Comparison report page.
- Consensus profile page.
- Correction guidance and draft declaration page.
- Admin rules page.

UX requirements:

- Show confidence clearly.
- Show the supporting-document count beside every confidence category.
- Clearly distinguish an outlier from `no_consensus`; the latter must never display a suggested correct value.
- State that the service checks document consistency, not legal correctness or scheme eligibility.
- Use simple explanations for judges and users.
- Show correction steps and supporting documents.
- Do not overload the UI with raw model details.

### Phase 18: Audit And Observability

Audit events:

```text
user.signup
document.uploaded
document.quality_checked
document.extracted
documents.pairwise_compared
consensus.recalculated
rules.retrieved
guidance.generated
document.deleted
```

Log:

- Rule ids used.
- Extraction confidence.
- Normalization result hashes.
- Decision status.
- Human-review reason.
- Evidence ids.

Never log raw PII.

### Phase 19: Testing

Unit tests:

- Auth.
- Encryption.
- Hash anchors.
- Normalizers.
- Rule engine.
- Consensus scoring.
- Translation cache.
- Draft-declaration schema validation.

Integration tests:

- Signup -> upload two matching documents -> consensus with a real agreement count.
- Four matching values and one different value -> consensus plus one likely outlier.
- Two values versus two values -> `no_consensus`, no chosen value, and manual-verification guidance.
- A year-only DOB and a full DOB in the same year -> `incomplete_date_conflict`.
- RAG retrieves rules but does not decide identity.
- Bhashini translation preserves names/IDs.
- Draft declaration is blocked unless the selected rule explicitly permits it and always includes the disclaimer.
- Non-admin cannot create rules.
- User A cannot access User B data or vectors.

Security tests:

- MongoDB has no plaintext field values.
- Qdrant metadata has no raw PII.
- Object storage files are encrypted.
- Deleting a document removes vectors and encrypted files.
- Consent withdrawal blocks future processing.

## 3. Known Risks And Mitigations

### Risk: Consensus Is Mistaken for Legal Truth

Mitigation:

- Never call the consensus value “correct,” “official,” or “ground truth.”
- Show the exact supporting-document count and document names.
- Limit the outcome to a likely-outlier flag and advisory correction path.

### Risk: Insufficient or Split Evidence

Mitigation:

- Require a strict majority; a tie or plurality is `no_consensus`.
- Do not select a value or generate a correction recommendation for no-consensus fields.
- Route the user to verify original records with the relevant issuing authority.

### Risk: Incomplete Dates Are Misclassified

Mitigation:

- Model date precision (year, month-year, full date) during extraction and normalization.
- Treat year-only/full-date combinations as `incomplete_date_conflict`, even where the year matches.

### Risk: LLM Makes Identity Decisions

Mitigation:

- Gemini only extracts and explains.
- Rule engine and consensus produce locked decisions.
- Validate all model JSON.

### Risk: RAG Becomes Decision Logic

Mitigation:

- Store executable rules in JSON/SQL.
- Use Qdrant only for evidence and citations.

### Risk: Legal Correction Advice Is Overconfident

Mitigation:

- Use disclaimer.
- Route sensitive issues to human review.
- Keep official rule sources and versions.

### Risk: Bhashini Translation Alters Official Values

Mitigation:

- Preserve official values.
- Translate only explanations and boilerplate.
- Add tests for names, DOBs, IDs, and addresses.

## 4. Demo Scope For Hackathon

Minimum working demo:

1. Auth.
2. Language selection.
3. Upload five synthetic documents.
4. Gemini extraction.
5. Deterministic, field-level pairwise comparison.
6. A 4-of-5 consensus example with a likely outlier.
7. A 2-vs-2 no-consensus example with manual-verification guidance.
8. Qdrant retrieval of cited correction guidance.
9. Gemini explanation of the locked outcome.
10. Bhashini translated report.
11. Conditional draft declaration PDF, with disclaimer.
12. Audit log view.

Defer if time is short:

- Live DigiLocker integration.
- Full PAN/Aadhaar/Birth certificate rule coverage.
- Advanced OCR alternatives.
- Full admin rule editor UI.
- Production KMS.

## 5. Definition Of Done

The implementation is done when:

- The app runs locally with Docker Compose.
- A user can create an account and log in.
- A user can choose a regional language.
- A user can upload multiple documents and receive a deterministic field-level consistency report.
- The engine establishes a consensus only from a strict majority and displays the real agreement count.
- The engine flags minority values as likely outliers without declaring them legally incorrect.
- A tied or otherwise split field returns `no_consensus` with manual-verification guidance and no suggested replacement value.
- Year-only and full DOB values are handled as incomplete-date conflicts.
- Correction rules are retrieved and cited.
- Gemini explanations are generated from locked decisions only.
- Bhashini translates reports and draft-declaration boilerplate.
- Permitted draft declarations are generated, encrypted, and downloadable.
- Sensitive data is encrypted.
- Hash anchors are stored.
- Audit logs show decision traceability.
