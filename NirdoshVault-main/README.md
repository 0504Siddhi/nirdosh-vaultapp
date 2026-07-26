# Nirdosh Vault

### AI-Powered Consensus Identity Engine for Pre-Submission Document Verification

> **Catch document inconsistencies before they become application
> rejections.**


## 🔗 Quick Links

- 🌐 **Live Demo:** https://nirdosh-vault-weld.vercel.app/
- 🎥 **Demo Video:** https://your-video-link
- 📑 **Presentation:** https://your-ppt-link
- 💻 **GitHub Repository:** https://github.com/yourusername/nirdosh-vault
------------------------------------------------------------------------

## Overview

Nirdosh Vault is a GovTech AI prototype that helps citizens identify
inconsistencies across identity documents **before** submitting
applications for scholarships, welfare schemes, admissions, and public
services.

Instead of assuming that a single document is always correct, the
platform compares information across multiple uploaded documents, builds
a **Consensus Identity Profile**, highlights conflicts, and provides
evidence-backed correction guidance.

------------------------------------------------------------------------

# Problem Statement

Millions of applications require multiple identity documents.

A single mismatch in fields such as:

-   Name
-   Date of Birth
-   Address
-   Parent Name
-   Gender

can delay verification or require repeated corrections.

Current systems generally validate documents **after submission**,
leaving citizens to discover problems only when applications are
rejected or marked defective.

------------------------------------------------------------------------

# Our Solution

Nirdosh Vault performs intelligent cross-document verification before
submission.

The platform:

-   Extracts structured information from uploaded documents
-   Compares common fields
-   Builds a consensus profile
-   Detects conflicting values
-   Explains conflicts using evidence
-   Suggests the appropriate correction authority
-   Generates a downloadable verification report

------------------------------------------------------------------------

# Key Features

-   AI-assisted document extraction
-   Consensus Identity Engine
-   Cross-document validation
-   Conflict detection
-   Evidence-backed explanations
-   Correction guidance
-   Nearby assistance-centre discovery
-   PDF report generation
-   Privacy-first processing

------------------------------------------------------------------------

# How It Works

``` text
Upload Documents
        │
        ▼
AI Extraction
        │
        ▼
Field Normalization
        │
        ▼
Consensus Identity Engine
        │
 ┌──────┴────────┐
 │               │
 ▼               ▼
Consensus     Conflict
 │               │
 └──────┬────────┘
        ▼
Correction Guidance
        │
        ▼
Verification Report
```

------------------------------------------------------------------------

# Technology Stack

| **Layer** | **Technology** |
|------------|----------------|
| **Frontend** | React · TypeScript · Vite · Tailwind CSS · React Router |
| **Backend** | Node.js · Express.js · TypeScript · RESTful APIs |
| **AI Model** | Google Gemini 2.5 Flash (Document Field Extraction & Natural Language Explanations) |
| **OCR Engine** | PaddleOCR (Python) |
| **Document Processing** | PDF & Image Processing · OCR Pipeline · Field Extraction · Data Normalization |
| **Identity Verification Engine** | Consensus Identity Engine · Cross-Document Field Comparison · Deterministic Validation Logic |
| **Correction Guidance Engine** | Rule-Based Correction Guidance · Authority Mapping · Evidence-Based Recommendations |
| **Database** | MongoDB |
| **Authentication** | JSON Web Tokens (JWT) · bcrypt |
| **Security** | Helmet · CORS · Environment Variables |
| **Logging & Monitoring** | Winston · Morgan |
| **Deployment** | Vercel (Frontend) · Render (Backend) · Docker |
| **Version Control** | Git · GitHub |
| **Languages** | TypeScript · HTML · Python · CSS · JavaScript |

------------------------------------------------------------------------

# Why Our Approach Is Different

Unlike systems that depend on one "master" document, Nirdosh Vault
compares all uploaded documents to identify the most consistent identity
information.

The platform never assumes AI is always correct.

AI assists with extraction and explanations, while consistency decisions
are based on deterministic comparison rules. Ambiguous cases are flagged
for manual verification.

------------------------------------------------------------------------

# Prototype Workflow

1.  Upload documents
2.  Extract fields
3.  Compare common attributes
4.  Build consensus profile
5.  Detect conflicts
6.  Recommend correction path
7.  Export report

------------------------------------------------------------------------

# Real-World Impact

Nirdosh Vault aims to:

-   Reduce preventable application rejections
-   Save citizens time and repeated visits
-   Assist CSC and service operators
-   Improve confidence before submission
-   Simplify document verification workflows

------------------------------------------------------------------------

# Screens

-   Landing Page
-   Dashboard
-   Upload Documents
-   Analysis Report
-   Conflict Details
-   Nearby Assistance Centres

------------------------------------------------------------------------

# Responsible AI

-   AI supports extraction only.
-   Final consistency analysis follows deterministic rules.
-   No document is treated as absolute truth.
-   Ambiguous cases require human verification.
-   The system provides advisory guidance only.

------------------------------------------------------------------------

# Local Setup

## Backend

``` bash
cd api
npm install
pip install -r requirements.txt
npm run dev
```

## Frontend

``` bash
cd ui
npm install
npm run dev
```

------------------------------------------------------------------------

# Environment Variables

``` env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
JWT_SECRET=
MONGODB_URI=
GOOGLE_MAPS_API_KEY=
```

------------------------------------------------------------------------

# Future Roadmap

-   DigiLocker integration
-   Multilingual support
-   Expanded correction guidance
-   Additional document types
-   Organization dashboard

------------------------------------------------------------------------

# Team

**Team:** Nexovate

**Project:** Nirdosh Vault

------------------------------------------------------------------------

# Disclaimer

This repository contains a hackathon prototype developed for innovation
and research purposes.

Nirdosh Vault is not affiliated with UIDAI, DigiLocker, CSC, Maha
e-Seva, NSP, or any government authority. The platform provides advisory
document consistency analysis and does not replace official verification
procedures.
