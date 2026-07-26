import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';

interface ExportPDFProps {
  analysis: any;
}

export default function ExportPDF({ analysis }: ExportPDFProps) {
  const handleExport = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const margin = 16;
    const contentW = W - margin * 2;
    let y = 20;

    const addText = (text: string, size: number, bold = false, color: [number, number, number] = [15, 23, 42]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, contentW);
      doc.text(lines, margin, y);
      y += lines.length * size * 0.4 + 2;
    };

    const addLine = () => {
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, W - margin, y);
      y += 4;
    };

    const checkPage = (needed = 20) => {
      if (y + needed > 280) {
        doc.addPage();
        y = 20;
      }
    };

    // ── Header ────────────────────────────────────────────────────
    doc.setFillColor(228, 161, 66);
    doc.rect(0, 0, W, 14, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('NIRDOSH VAULT — Consensus Identity Report', margin, 9);
    y = 22;

    const createdAtFormatted = analysis?.createdAt ? new Date(analysis.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
    const analysisIdStr = String(analysis?._id ?? 'C3787');

    addText(`Generated: ${createdAtFormatted}`, 9, false, [100, 116, 139]);
    addText(`Session reference: NV-${analysisIdStr.slice(-5).toUpperCase()}`, 9, false, [100, 116, 139]);
    y += 2;
    addLine();

    // ── Overall status ───────────────────────────────────────────
    const s = analysis?.summary ?? {};
    const conflictCount = s.conflictFieldsCount ?? 0;
    addText(`Overall Status: ${conflictCount > 0 ? 'Review Required' : 'Consistent'}`, 14, true, conflictCount > 0 ? [180, 83, 9] : [16, 120, 85]);
    addLine();

    // ── Summary (Updated to match engine summary schema) ───────────
    addText('Summary', 13, true);

    addText(`• Comparable Fields Checked: ${s.comparableFieldsCount ?? 0}`, 10);
    addText(`• Consensus Established: ${s.consensusFieldsCount ?? 0}`, 10, false, [16, 185, 129]);
    addText(`• Conflicts Detected: ${conflictCount}`, 10, false, conflictCount > 0 ? [239, 68, 68] : [16, 185, 129]);
    
    if (analysis?.documentSpecificFields?.length > 0) {
      addText(`• Document-Specific Attributes: ${analysis.documentSpecificFields.length} recorded`, 10, false, [59, 130, 246]);
    }
    
    y += 2;
    addLine();

    // ── Field Results ─────────────────────────────────────────────
    addText('Field-by-Field Results', 13, true);
    for (const result of (analysis?.fieldResults ?? [])) {
      checkPage(18);
      const statusColor: Record<string, [number, number, number]> = {
        consistent: [16, 185, 129],
        possible_variant: [59, 130, 246],
        outlier_detected: [245, 158, 11],
        conflicting_evidence: [239, 68, 68],
        extraction_uncertain: [249, 115, 22],
        not_comparable: [100, 116, 139],
        missing: [100, 116, 139],
      };
      const col = statusColor[result.status] ?? [100, 116, 139];
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${result.label}`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...col);
      doc.text(result.status.replace(/_/g, ' '), margin + 60, y);
      y += 5;
      if (result.consensusValue) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.text(`   Consensus value: ${result.consensusValue}`, margin, y);
        y += 5;
      }
      if (result.explanation) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(`   ${result.explanation}`, contentW - 5);
        doc.text(lines, margin, y);
        y += lines.length * 3.5 + 2;
      }
    }
    addLine();

    // ── Guidance ──────────────────────────────────────────────────
    if (analysis?.guidance?.length > 0) {
      checkPage(20);
      addText('Correction Guidance', 13, true);
      for (const g of analysis.guidance) {
        checkPage(18);
        if (g?.fieldLabel) addText(`${g.issueStatus?.toUpperCase() || 'INFO'} — ${g.fieldLabel}`, 10, true);
        if (g?.explanation) addText(g.explanation, 9, false, [100, 116, 139]);
        y += 2;
      }
      addLine();
    }

    // ── Checklist ─────────────────────────────────────────────────
    const eligible = (analysis?.checklist ?? []).filter((c: any) => c.readiness === 'uploaded');
    if (eligible.length > 0) {
      checkPage(20);
      addText('Document Checklists Ready', 13, true);
      for (const scheme of eligible) {
        checkPage(14);
        addText(`Required document types uploaded: ${scheme.schemeName}`, 10, true, [16, 185, 129]);
        addText(`   ${scheme.ministry}`, 8, false, [100, 116, 139]);
        y += 2;
      }
      addLine();
    }

    // ── Disclaimer ────────────────────────────────────────────────
    checkPage(20);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    const disclaimer = 'DISCLAIMER: This report is generated by the Nirdosh Vault prototype for informational purposes only. It shows document consistency and does not constitute legal proof of identity. The issuing authority for each document remains the source of legal truth. Do not share this report publicly. Only synthetic/sample documents should be used with this prototype.';
    const dlines = doc.splitTextToSize(disclaimer, contentW);
    doc.text(dlines, margin, y);

    const safeFileId = analysisIdStr.length >= 6 ? analysisIdStr.slice(-6) : 'report';
    doc.save(`nirdosh-vault-report-${safeFileId}.pdf`);
  };

  return (
    <button
      id="export-pdf-btn"
      onClick={handleExport}
      className="btn btn-secondary flex items-center gap-2"
    >
      <Download size={16} />
      Download PDF
    </button>
  );
}