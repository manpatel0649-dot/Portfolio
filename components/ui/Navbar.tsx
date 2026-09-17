"use client";

import { useEffect, useState } from "react";
import { profile } from "@/content/profile";

const navLinks = [
  { n: "01", label: "Work", href: "#work" },
  { n: "02", label: "Capabilities", href: "#capabilities" },
  { n: "03", label: "Data", href: "#data" },
  { n: "04", label: "About", href: "#about" },
  { n: "05", label: "Writing", href: "#writing" },
];

export default function Navbar() {
  const [active, setActive] = useState("work");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Scrollspy — track which section is in view
  useEffect(() => {
    const ids = navLinks.map((l) => l.href.slice(1));
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const closeMenu = () => setMobileOpen(false);

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(14px)",
          background: "rgba(4,28,28,.55)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="wrap"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 66,
          }}
        >
          {/* Brand */}
          <a
            href="#"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                border: "1px solid var(--line-2)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-serif)",
                fontSize: 18,
                fontStyle: "italic",
                textTransform: "none",
                letterSpacing: 0,
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              M
            </span>
            <span className="hidden-mobile">Man Panchotiya</span>
          </a>

          {/* Desktop links */}
          <div
            className="hidden-mobile"
            style={{
              display: "flex",
              gap: 4,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            {navLinks.map((l) => {
              const isActive = active === l.href.slice(1);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  style={{
                    padding: "8px 14px",
                    color: isActive ? "var(--cream)" : "var(--cream-2)",
                    borderRadius: 4,
                    background: isActive ? "var(--panel-2)" : "transparent",
                    boxShadow: isActive ? "inset 0 0 0 1px var(--line)" : "none",
                    transition: ".2s",
                  }}
                >
                  <span style={{ color: "var(--cream-3)", marginRight: 6 }}>
                    {l.n}
                  </span>
                  {l.label}
                </a>
              );
            })}
          </div>

          {/* CTA + mobile toggle */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="#contact" className="btn btn-pri">
              Let&apos;s talk <span style={{ fontFamily: "var(--font-sans)" }}>→</span>
            </a>
            {/* Mobile hamburger */}
            <button
              className="show-mobile"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              style={{
                display: "none",
                background: "none",
                border: "none",
                color: "var(--cream)",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
              }}
            >
              Menu
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          <button
            onClick={closeMenu}
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              background: "none",
              border: "none",
              color: "var(--cream-3)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            Close
          </button>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={closeMenu}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "var(--cream)",
              }}
            >
              <span style={{ color: "var(--em)", marginRight: 12 }}>{l.n}</span>
              {l.label}
            </a>
          ))}
          <a href="#contact" onClick={closeMenu} className="btn btn-pri" style={{ marginTop: 16 }}>
            Let&apos;s talk →
          </a>
        </div>
      )}

      {/* Show/hide helpers via media queries in a style tag */}
      <style>{`
        @media (max-width: 900px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
