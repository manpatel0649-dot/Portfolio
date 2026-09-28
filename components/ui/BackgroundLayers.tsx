import DynamicCanvas from "@/components/three/DynamicCanvas";

// Fixed background layers behind all content.
export default function BackgroundLayers() {
  return (
    <>
      {/* ── 3D Canvas — aria-hidden; decorative only ── */}
      <p className="sr-only">Animated neural network background illustration</p>
      <div aria-hidden="true" role="presentation">
        <DynamicCanvas />
      </div>

      {/* Glow A — large teal circle top-right */}
      <div
        className="fixed pointer-events-none z-0 rounded-full"
        style={{
          width: 760,
          height: 760,
          right: -200,
          top: -240,
          background: "rgba(20,120,95,.22)",
          filter: "blur(120px)",
        }}
      />

      {/* Glow B — smaller emerald circle bottom-left */}
      <div
        className="fixed pointer-events-none z-0 rounded-full"
        style={{
          width: 640,
          height: 640,
          left: -240,
          bottom: -260,
          background: "rgba(52,211,153,.08)",
          filter: "blur(120px)",
        }}
      />

      {/* Film grain overlay */}
      <div
        className="fixed pointer-events-none z-[1]"
        style={{
          inset: "-50%",
          opacity: 0.07,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette — darkens edges to keep text readable over 3D */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(2,14,14,.75) 100%)",
        }}
      />
    </>
  );
}
