import { ratingColor } from '@/lib/utils/score';
import { ScoreRating } from '@/lib/types';

interface Props {
  score: number | null;
  rating: ScoreRating;
  label: string;
  size?: number;
}

export default function ScoreGauge({ score, rating, label, size = 100 }: Props) {
  const radius = 38;
  const circumference = Math.PI * radius; // half circle
  const offset = score != null ? circumference * (1 - score / 100) : circumference;
  const color = ratingColor(rating);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size * 0.6} viewBox="0 0 100 55">
        {/* Track */}
        <path
          d={`M 11 50 A 39 39 0 0 1 89 50`}
          fill="none"
          stroke="#1e293b"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M 11 50 A 39 39 0 0 1 89 50`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        {/* Score text */}
        <text x="50" y="44" textAnchor="middle" fill="white" fontSize="18" fontWeight="700">
          {score != null ? score : '—'}
        </text>
      </svg>
      <span className="text-slate-400 text-sm font-medium">{label}</span>
    </div>
  );
}
