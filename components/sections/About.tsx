import { about } from "@/content/about";

export default function About() {
  return (
    <section className="section" id="about">
      <div className="wrap">
        <div className="shead">
          <div>
            <div className="section-label">
              <b>05</b> About
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 400,
                fontSize: 56,
                lineHeight: 1.05,
                letterSpacing: "-.02em",
                marginTop: 18,
              }}
            >
              The person{" "}
              <i style={{ color: "var(--em)" }}>behind</i> the work
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: 64,
            alignItems: "start",
          }}
          className="about-grid"
        >
          {/* Left: photo + timeline */}
          <div>
            {/* Photo */}
            <div
              style={{
                width: "100%",
                aspectRatio: "4/3",
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r)",
                overflow: "hidden",
                marginBottom: 44,
                position: "relative",
              }}
            >
              {about.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={about.photo}
                  alt="Man Panchotiya"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    color: "var(--cream-3)",
                  }}
                >
                  [ photo ]
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="timeline">
              {about.timeline.map((item) => (
                <div
                  key={item.text}
                  className={`timeline-item${item.now ? " now" : ""}`}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9.5,
                      letterSpacing: ".14em",
                      textTransform: "uppercase",
                      color: item.now ? "var(--em)" : "var(--cream-3)",
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: item.now ? "var(--cream)" : "var(--cream-2)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: quote + bio */}
          <div>
            <blockquote
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 28,
                lineHeight: 1.4,
                fontWeight: 400,
                borderLeft: "2px solid var(--em)",
                paddingLeft: 28,
                marginBottom: 40,
                color: "var(--cream)",
              }}
            >
              {about.quote.before}
              <i style={{ color: "var(--em)" }}>{about.quote.italic}</i>
              {about.quote.after}
            </blockquote>

            <div
              style={{
                fontSize: 15,
                color: "var(--cream-2)",
                lineHeight: 1.75,
                whiteSpace: "pre-line",
              }}
            >
              {about.bio}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
