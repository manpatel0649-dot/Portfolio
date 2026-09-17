import { blogPosts } from "@/content/blog";

export default function Writing() {
  return (
    <section className="section" id="writing" style={{ background: "var(--bg2)" }}>
      <div className="wrap">
        <div className="shead">
          <div>
            <div className="section-label">
              <b>06</b> Writing
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
              What I&apos;ve been{" "}
              <i style={{ color: "var(--em)" }}>thinking</i>
            </h2>
          </div>
        </div>

        <div>
          {blogPosts.map((post) => (
            <a
              key={post.title}
              href={post.url}
              className="post-row"
              style={{ display: "grid", textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--em)",
                }}
                className="post-meta"
              >
                {post.category}
                <span
                  style={{
                    display: "block",
                    color: "var(--cream-3)",
                    marginTop: 2,
                  }}
                >
                  {post.readTime} read
                </span>
              </div>

              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 20,
                  lineHeight: 1.35,
                }}
              >
                {post.title}
              </div>

              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: ".1em",
                  color: "var(--cream-3)",
                  textAlign: "right",
                }}
                className="post-date"
              >
                {post.date}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  color: "var(--cream-3)",
                  fontSize: 18,
                }}
              >
                →
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
