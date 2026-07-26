
interface ProgressBarProps {
  /** 0–100 */
  progress: number;
  phase: string;
}

const PHASE_COLOR = {
  0: '#f59e0b',   // saffron — uploading
  25: '#3b82f6',  // blue — quality check
  50: '#8b5cf6',  // purple — extracting
  85: '#10b981',  // green — finalising
};

function getColor(progress: number): string {
  if (progress >= 85) return PHASE_COLOR[85];
  if (progress >= 50) return PHASE_COLOR[50];
  if (progress >= 25) return PHASE_COLOR[25];
  return PHASE_COLOR[0];
}

export default function ProgressBar({ progress, phase }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const color = getColor(clampedProgress);

  return (
    <div className="w-full" id="extraction-progress-bar">
      {/* Phase label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color }}>
          {phase}
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {Math.round(clampedProgress)}%
        </span>
      </div>

      {/* Track */}
      <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
        {/* Fill with animated gradient shimmer */}
        <div
          className="h-full rounded-full relative overflow-hidden transition-all duration-700 ease-out"
          style={{
            width: `${clampedProgress}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
          }}
        >
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
              animation: 'shimmer 1.4s infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex justify-between mt-2.5">
        {[
          { label: 'Upload', threshold: 0 },
          { label: 'Quality', threshold: 25 },
          { label: 'Extract', threshold: 50 },
          { label: 'Done', threshold: 85 },
        ].map(step => (
          <div
            key={step.label}
            className="flex flex-col items-center gap-1"
          >
            <div
              className="w-2 h-2 rounded-full transition-all duration-500"
              style={{
                background: clampedProgress >= step.threshold ? color : 'rgba(255,255,255,0.15)',
                boxShadow: clampedProgress >= step.threshold ? `0 0 6px ${color}` : 'none',
              }}
            />
            <span
              className="text-[9px] font-medium uppercase tracking-wide transition-colors duration-500"
              style={{ color: clampedProgress >= step.threshold ? color : 'rgba(148,163,184,0.5)' }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
