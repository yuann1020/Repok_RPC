'use client';

interface PickleballLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const SIZES = {
  sm: { ball: 24, cx: 12, r: 10, dots: 2.5 },
  md: { ball: 36, cx: 18, r: 15, dots: 3.5 },
  lg: { ball: 52, cx: 26, r: 22, dots: 5   },
};

/**
 * Premium pickleball-inspired loading indicator.
 * A dark ball with 6 dot holes arranged in two arcs (faithful to real pickleball geometry),
 * wrapped in a faint green ring. Spins at 1.4s — slow enough to feel composed.
 */
export function PickleballLoader({ size = 'md', label, className = '' }: PickleballLoaderProps) {
  const s = SIZES[size];
  const { ball, cx, r, dots: dr } = s;

  // 6 dot positions in 2 arcs of 3, offset around the center
  // These mimic the real pickleball hole pattern (two clusters of 3)
  const dotRadius = r * 0.52;
  const DOTS = [
    // Arc 1 — upper-left cluster
    { angle: 210 },
    { angle: 250 },
    { angle: 290 },
    // Arc 2 — lower-right cluster
    { angle: 30  },
    { angle: 70  },
    { angle: 110 },
  ].map(({ angle }) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + dotRadius * Math.cos(rad),
      y: cx + dotRadius * Math.sin(rad),
    };
  });

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <svg
        width={ball}
        height={ball}
        viewBox={`0 0 ${ball} ${ball}`}
        fill="none"
        className="animate-premium-spin"
        aria-label="Loading"
        role="img"
      >
        {/* Outer glow ring */}
        <circle
          cx={cx}
          cy={cx}
          r={r + 1.5}
          stroke="rgba(74, 222, 128, 0.25)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Ball body */}
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="#0a1628"
          stroke="rgba(74, 222, 128, 0.18)"
          strokeWidth="1"
        />

        {/* Dot holes */}
        {DOTS.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={dr / 2}
            fill="rgba(74, 222, 128, 0.55)"
          />
        ))}
      </svg>

      {label && (
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">
          {label}
        </span>
      )}
    </div>
  );
}
