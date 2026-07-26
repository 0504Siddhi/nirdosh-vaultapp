# Nirdosh Vault - Setup & Run Guide

This document outlines the steps required to get the Nirdosh Vault application (Frontend + Backend) up and running locally.

## Prerequisites
- **Node.js**: v18 or newer
- **Python**: v3.8 to v3.11 (Required for PaddleOCR)
- **Git**

## 1. Backend (API) Setup

The backend is built with Node.js/Express and uses a Python micro-script (`paddle_extract.py`) for OCR document extraction.

### Installation
1. Open a terminal and navigate to the `api` folder:
   ```bash
   cd api
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Setup Python environment and install PaddleOCR (if not already installed globally):
   ```bash
   pip install paddlepaddle paddleocr
   ```

### Running the Backend
Start the development server (runs on `http://localhost:3000` by default):
```bash
npm run dev
```

---

## 2. Frontend (UI) Setup

The frontend is built with React and Vite.

### Installation
1. Open a new terminal and navigate to the `ui` folder:
   ```bash
   cd ui
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```

### Running the Frontend
Start the Vite development server (typically runs on `http://localhost:5173`):
```bash
npm run dev
```

## Troubleshooting
- **PaddleOCR C++ Crash on Windows**: If you experience an internal C++ crash when uploading documents (`ConvertPirAttribute2RuntimeAttribute not support`), this is a known issue with PaddlePaddle's new PIR API and MKL-DNN. The backend script `paddle_extract.py` has been explicitly configured to bypass this by disabling `mkldnn` and the `pir` API. 
- **OCR Outputs Not Parsing**: The Node.js parser is designed to be robust and looks explicitly for the `:::` delimiter. Any internal PaddleOCR warnings in `stdout` are safely ignored.
