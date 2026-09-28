// Static SVG loss curve matching the reference (exponential decay with noise)
export default function LossChart() {
  // Pre-computed curve points that go DOWN from left to right (loss decreasing)
  const pts: string[] = [];
  let l = 100;
  for (let i = 0; i <= 80; i++) {
    l = 12 + 88 * Math.exp(-i / 18) + (Math.random() - 0.5) * 6;
    pts.push(`${i * 5},${120 - Math.min(110, Math.max(8, l))}`);
  }
  const pointsStr = pts.join(" ");

  return (
    <div
      style={{
        margin: "14px 28px 28px",
        height: 120,
        border: "1px solid var(--line)",
        borderRadius: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="lossGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#34d399" stopOpacity=".25" />
            <stop offset="1" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <g stroke="rgba(255,230,203,.08)">
          {[30, 60, 90].map((y) => (
            <line key={y} x1="0" x2="400" y1={y} y2={y} />
          ))}
        </g>
        {/* Area fill */}
        <polygon
          fill="url(#lossGrad)"
          points={`0,120 ${pointsStr} 400,120`}
        />
        {/* Loss line — id used by SectionAnimations for scroll-scrub dashoffset */}
        <polyline
          id="loss-line"
          fill="none"
          stroke="#34d399"
          strokeWidth="1.6"
          points={pointsStr}
          vectorEffect="non-scaling-stroke"
        />
        {/* Label */}
        <text
          x="8"
          y="16"
          fill="rgba(255,230,203,.45)"
          fontFamily="Geist Mono"
          fontSize="9"
          letterSpacing="1.2"
        >
          TRAINING LOSS
        </text>
      </svg>
    </div>
  );
}
