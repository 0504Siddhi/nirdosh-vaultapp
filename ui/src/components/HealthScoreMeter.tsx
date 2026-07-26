
interface HealthScoreProps {
  score: number;
}

function getScoreConfig(score: number) {
  if (score >= 80) return { color: '#10b981', label: 'Excellent Consistency', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' };
  if (score >= 60) return { color: '#f59e0b', label: 'Good Consistency', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' };
  if (score >= 40) return { color: '#f97316', label: 'Moderate Issues Found', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' };
  return { color: '#ef4444', label: 'Significant Inconsistencies', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' };
}

export default function HealthScoreMeter({ score }: HealthScoreProps) {
  const { color, label, bg, border } = getScoreConfig(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div
      id="identity-health-score"
      className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border"
      style={{ background: bg, borderColor: border }}
    >
      {/* Circular progress */}
      <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          {/* Track */}
          <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="65" cy="65" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            strokeDashoffset="0"
            transform="rotate(-90 65 65)"
            style={{ transition: 'stroke-dasharray 1s ease-out', filter: `drop-shadow(0 0 6px ${color}55)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{ color }}>{score}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">/100</span>
        </div>
      </div>

      {/* Text */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Identity Health Score</div>
        <div className="text-2xl font-bold mb-2" style={{ color }}>{label}</div>
        <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
          This score reflects the weighted consistency of your identity documents.
          {score >= 80 && ' Your documents are highly consistent — no major action required.'}
          {score >= 60 && score < 80 && ' Some minor inconsistencies were found. Review the flagged fields below.'}
          {score >= 40 && score < 60 && ' Several fields have inconsistencies. Visit the relevant authority to reconcile them.'}
          {score < 40 && ' Significant discrepancies detected across multiple fields. Immediate verification recommended.'}
        </p>
        {/* Mini legend */}
        <div className="flex flex-wrap gap-3 mt-4">
          {[
            { min: 80, label: '80–100 Excellent', color: '#10b981' },
            { min: 60, label: '60–79 Good', color: '#f59e0b' },
            { min: 40, label: '40–59 Moderate', color: '#f97316' },
            { min: 0, label: '0–39 Critical', color: '#ef4444' },
          ].map(tier => (
            <div key={tier.min} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: tier.color }} />
              <span className="text-[10px] text-slate-500">{tier.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
