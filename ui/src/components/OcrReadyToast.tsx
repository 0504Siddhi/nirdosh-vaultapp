import { useEffect, useState, useRef } from 'react';
import api from '../api/client';

/**
 * OcrReadyToast — polls /api/v1/status after mount until ocrReady is true,
 * then shows a brief toast notification and stops polling.
 * Only shows once per session (tracked in sessionStorage).
 */
export default function OcrReadyToast() {
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Don't show if already notified this session
    if (sessionStorage.getItem('ocr_toast_shown')) return;

    const poll = async () => {
      try {
        const { data } = await api.get('/status');
        if (data.ocrReady) {
          clearInterval(intervalRef.current!);
          sessionStorage.setItem('ocr_toast_shown', 'true');
          setVisible(true);
          // Auto-dismiss after 5 s
          setTimeout(() => setVisible(false), 5000);
        }
      } catch {
        // silently ignore if status endpoint unavailable
      }
    };

    // Poll every 4 seconds
    intervalRef.current = setInterval(poll, 4000);
    poll(); // run immediately too

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!visible) return null;

  return (
    <div
      id="ocr-ready-toast"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-green-500/30 shadow-2xl shadow-green-500/10 animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
        <span className="text-base">⚡</span>
      </div>
      <div>
        <div className="text-sm font-bold text-green-400">OCR Engine Ready</div>
        <div className="text-xs text-slate-400">PaddleOCR loaded — extraction is now accelerated</div>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="ml-2 text-slate-500 hover:text-white transition-colors text-xs"
        aria-label="Dismiss"
      >✕</button>
    </div>
  );
}
