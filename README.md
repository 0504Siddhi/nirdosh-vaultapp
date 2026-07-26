# Nirdosh Vault

> Implementation status (2026-07-24): deterministic evidence comparison, rule-target confirmation, temporary processing cleanup, and document-readiness output are implemented. Qdrant RAG, live DigiLocker, and any government-authority integration are not implemented.

**An AI-powered Consensus Identity Engine that helps citizens catch document inconsistencies before they cause government application rejections.**

> India already has digital document infrastructure. The missing layer is intelligence. Nirdosh Vault doesn't replace DigiLocker, it adds an AI-powered verification layer that detects, explains, and helps resolve document inconsistencies before citizens face rejection.

**Status:** Hackathon MVP — active development

---

## The Problem

Citizens applying for government schemes, scholarships, and services can be rejected not because they're ineligible, but because their own documents disagree with each other. A name spelled "Sanjay Patil" on one document and "S.P. Patil" on another can silently block a scholarship, a PM-KISAN subsidy, or an admission.

- NITI Aayog's Frontier Tech Hub notes that erroneous or duplicate beneficiary records inflate welfare outlays by an estimated **4–7% annually** through fiscal leakage — *NITI Aayog Frontier Tech Hub, Quarterly Insight*. As the report puts it: *"When one wrong digit can freeze a pension or misroute a subsidy, quality is no longer a technical afterthought but a frontline service obligation."*
- The Direct Benefit Transfer (DBT) ecosystem supports hundreds of government welfare schemes across 56 ministries. Nirdosh Vault focuses on improving document consistency before citizens apply to these services.
- Official UIDAI guidance confirms that demographic mismatches between PAN and Aadhaar including name, gender, and date of birth can prevent successful linking.

These platforms (DigiLocker, UMANG, India Stack, API Setu) primarily focus on issuing, storing, accessing, and sharing documents. Nirdosh Vault focuses specifically on pre-submission cross-document consistency checking.

**Our own user research:** A family applying for their child's higher-education admission discovered their Birth Certificate and School Leaving Certificate listed different places of birth. The school redirected them to a Maha eSeva center, which couldn't correct the record directly — they were quoted ~₹500 for an affidavit just to *begin* the correction process. The admission stalled.

## What Nirdosh Vault Does

Nirdosh Vault does **not** decide which document is legally correct, and it does **not** replace any government authority. It:

1. **Detects** inconsistencies across a citizen's own uploaded documents
2. **Explains** them in plain language, backed by evidence
3. **Guides** the citizen toward the right correction path and issuing authority

The legal correction always remains with the issuing authority (UIDAI, Income Tax Dept, Registrar of Births, etc.) — Nirdosh Vault solves the problem that happens *before* government verification, not government verification itself.

---

## Core Innovation: The Consensus Identity Engine

We do not designate any single document — including Aadhaar — as ground truth. That approach fails the moment the trusted document itself contains an error.

Instead, **every uploaded document is compared against every other document**, field by field:

- Where a **majority agree** → that's the consensus value; the minority is flagged as a likely outlier
- Where there's **no clear majority** (e.g. a 2-vs-2 split) → the system doesn't guess. It reports the conflict and recommends manual verification

```
✅ Consensus Established
Field: Name
Consensus Value: Sanjay Patil
Supporting (4): Aadhaar, PAN, Passport, School Leaving Certificate
Outlier: Birth Certificate → "Sanjay Paatil"
Confidence: High (4 of 5 documents agree)
```

```
⚠️ Conflicting Evidence — No Consensus Reached
Field: Date of Birth
Group A (2): Aadhaar, PAN — 12-05-2004
Group B (2): Passport, Birth Certificate — 13-05-2004
Confidence: Insufficient — no majority
Recommendation: Please verify original records with the relevant issuing authority.
```

Confidence is always a **category tied to a real agreement count** never a fabricated percentage.

**Declared/approximate DOB handling:** UIDAI recognizes declared or approximate DOB where valid proof was unavailable at enrolment. When a document contains only a birth year while another contains a complete date in the same year, Nirdosh Vault classifies it as an **incomplete-date conflict** rather than automatically treating it as an exact match — the user is advised to verify the underlying record.

## Correction Guidance Engine

When an outlier is flagged, Nirdosh Vault generates evidence-backed, **advisory** correction guidance — never a definitive legal instruction:

- Evidence summary from the Consensus Engine
- Correction-path recommendation using hedged language (e.g. "additional documentation may be required depending on the issuing authority")
- A draft declaration, generated only where our verified rule base confirms that's the actual required path — never labeled "legally valid" or "official"
- Supporting documents checklist
- Recommended authority (UIDAI Seva Kendra, municipal registrar, CSC, etc.)
- Every output carries an explicit disclaimer: *"Draft for review — verify with the relevant authority before notarization or submission."*

Every rule shipped is tied to a specific official source. Each rule record includes source title, issuing authority, official URL/section, and last-verified date .

---

## Scope (MVP)

- **User segments:** Students (NSP, MAHADBT scholarships) and Farmers (PM-KISAN) — other categories shown as "Coming Soon"
- **Documents:** Aadhaar, PAN, Birth Certificate, School Leaving Certificate, Marksheet
- **Claim boundary:** Nirdosh Vault verifies *document consistency*, never *scheme eligibility*. Screens show "Documents Ready," never "Eligible."

---

## Tech Stack

| Layer | Technology |
|---|---|
| Document extraction | `gemini-3.5-flash` (multimodal) |
| Input quality gate | OpenCV (blur, brightness, resolution, orientation) |
| Output validation | Zod / Pydantic + JSON Schema |
| Normalization | Deterministic utilities (dates, names, addresses, initials) |
| Field matching | Deterministic rule engine — not black-box ML |
| Consensus | Field-level pairwise consensus with majority voting and outlier detection |
| Human-review routing | Deterministic confidence and exception rules |
| Rule storage | Structured, versioned rule database — kept separate from the retrieval layer below |
| Guidance retrieval | Qdrant (RAG) — supporting evidence and citations only, never the decision itself |
| Explanation | `gemini-3.5-flash` |
| Audit trail | Structured decision logs |
| Frontend | React + TypeScript + Tailwind |
| Backend | Node.js / TypeScript |



---

## Architecture

```
Document Upload
      │
      ▼
OpenCV Quality Gate (blur, brightness, orientation)
      │
      ▼
Gemini Multimodal Extraction → JSON Schema Validation
      │
      ▼
Normalization (dates, names, addresses)
      │
      ▼
Pairwise Consensus Engine (majority vote per field)
      │
   ┌──┴──────────────┐
   ▼                  ▼
Consensus Reached   No Consensus
   │                  │
   ▼                  ▼
Outlier Flagged     "Conflicting evidence —
                      manual verification required"
      │
      ▼
Correction Guidance Engine (rule lookup + Qdrant citation retrieval)
      │
      ▼
Gemini Explanation Layer (plain-language output)
      │
      ▼
Correction Kit (evidence + hedged guidance + disclaimer)
```

---

## What's Actually Built vs. In Progress vs. Roadmap

**Implemented in current prototype:**
-  Document upload and extraction 
-  Field normalization and deterministic comparison
-  Pairwise consensus and outlier detection 
-  Qualitative confidence labels
-  Correction Kit interface
-  Initial rule tables

**Integration in progress:**
-  Live Gemini multimodal extraction
-  OpenCV quality checks
-  Qdrant-backed citation retrieval
-  Automatic temporary-file deletion
-  Nearby assistance-centre discovery

**Roadmap:**
- Live DigiLocker API integration
- CSC-operator interface
- Expanded document/rule coverage
- Blockchain audit trail
- Full Bhashini multilingual support


### Nearby Assistance-Centre Discovery

To help users act on correction guidance, Nirdosh Vault can locate nearby government assistance centres after a document mismatch is detected. The MVP uses one-time location access to find relevant centres and redirects users to Google Maps for navigation. No continuous location tracking is performed.

| Layer | Technology |
|---|---|
| Nearby-centre discovery | Browser Geolocation API + Google Places API |
| Distance calculation | Haversine Formula |
| Cache | MongoDB TTL Cache |
| Navigation | Google Maps Deep Link |

**Workflow**

1. User grants one-time location permission.
2. The application retrieves the current location using the Browser Geolocation API.
3. Nearby CSCs, Maha eSeva Centres, or other relevant assistance centres are fetched using the Google Places API.
4. Results are sorted by distance using the Haversine Formula.
5. Selecting a centre opens Google Maps for turn-by-turn navigation.

---

## Privacy & Compliance

The intended production design processes documents temporarily and deletes them after verification, with explicit granular consent, purpose limitation, and data minimization —Designed in accordance with the core principles of the Digital Personal Data Protection (DPDP) Act, 2023, including consent, purpose limitation, data minimization, and storage limitation. This is a student prototype and has not undergone formal legal compliance certification.

> **Privacy Notice:** This prototype is intended for demonstration purposes. Please use synthetic or redacted documents instead of real Aadhaar, PAN, or other sensitive personal documents.

---

## Demo

- Live demo URL: *add link*
- Demo video: *add link*
- Screenshots: *add 2-4 screenshots*
- Sample test credentials: *only if appropriate for a public repo*
- **Use synthetic documents only in any public demo.**

---

## Getting Started

### Prerequisites
- Node.js: *specify version*
- npm: *specify version*
- MongoDB: *required — specify version if pinned*
- Qdrant: *required if RAG layer is active*
- Google Gemini API access

```bash
git clone https://github.com/0504Siddhi/nirdosh-vault.git
cd nirdosh-vault
npm install
```

### Environment Variables
```env
GEMINI_MODEL=gemini-3.5-flash
GEMINI_API_KEY=your_key_here
QDRANT_URL=your_qdrant_instance
MONGODB_URI=your_mongodb_connection
GOOGLE_PLACES_KEY=your_server_side_key
```
Never commit `.env` or real API keys to the repository.

### Scripts
*(Only list scripts that actually exist in `package.json`)*
```bash
npm run dev
npm run build
npm test
npm run lint
```

### Repository Structure
*(Replace with your actual folder layout)*
```
src/
├── extraction/
├── normalization/
├── consensus/
├── rules/
├── guidance/
├── audit/
└── components/
```

---

## Official References

Rule records should each cite: source title, issuing authority, official URL, page/section, last-verified date.

- UIDAI official guidance and FAQs — uidai.gov.in
- UIDAI Exception Handling SOP (28 Oct 2021)
- PAN Form 49A instructions — Protean (NSDL) / Income Tax Department
- Registration of Births and Deaths Act, 1969 (Sections 13, 14, 15) + 2023 Amendment
- NITI Aayog Frontier Tech Hub, Quarterly Insight (fiscal leakage estimate)
- DBT Bharat portal — dbtbharat.gov.in

---

## License

Repository is currently private / unlicensed. Add a license only when you've deliberately decided how others may reuse the code.

---

## Team

**Team Name:** Nexovate
