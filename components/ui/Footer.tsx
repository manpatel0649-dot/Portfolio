export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)" }}>
      <div
        className="wrap"
        style={{
          display: "flex",
          justifyContent: "space-between",
          height: 70,
          alignItems: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--cream-3)",
        }}
      >
        <span>© 2026 Man Panchotiya</span>
        <span>Built with Next.js · Three.js</span>
      </div>
    </footer>
  );
}
