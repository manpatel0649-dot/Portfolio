"use client";

import { useState } from "react";
import { contact } from "@/content/contact";
import Btn from "@/components/ui/Btn";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mailto fallback — real form handling to be wired up later
    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:manpatel0649@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <section className="section" id="contact">
      <div className="wrap">
        <div className="shead">
          <div>
            <div className="section-label">
              <b>07</b> Contact
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
              {contact.headline.before}
              <i style={{ color: "var(--em)" }}>{contact.headline.italic}</i>
              {contact.headline.after}
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 40,
            alignItems: "start",
          }}
          className="contact-grid"
        >
          {/* Form panel */}
          <div className="panel corner">
            <div className="bar">
              <span>{contact.form.barLeft}</span>
              <span>{contact.form.barRight}</span>
            </div>

            {sent ? (
              <div
                style={{
                  padding: "48px 28px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 24,
                    marginBottom: 12,
                  }}
                >
                  Message <i style={{ color: "var(--em)" }}>sent</i>
                </div>
                <p style={{ fontSize: 14, color: "var(--cream-2)" }}>
                  I&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: "8px 0 24px" }}>
                <div className="form-field" style={{ margin: "0 28px" }}>
                  <label htmlFor="f-name"><b>name&gt;</b></label>
                  <input
                    id="f-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    style={{
                      background: "none",
                      border: "none",
                      outline: "none",
                      fontFamily: "var(--font-term)",
                      fontSize: 15,
                      color: "var(--cream)",
                      flex: 1,
                    }}
                  />
                </div>
                <div className="form-field" style={{ margin: "0 28px" }}>
                  <label htmlFor="f-email"><b>email&gt;</b></label>
                  <input
                    id="f-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      background: "none",
                      border: "none",
                      outline: "none",
                      fontFamily: "var(--font-term)",
                      fontSize: 15,
                      color: "var(--cream)",
                      flex: 1,
                    }}
                  />
                </div>
                <div
                  className="form-field"
                  style={{
                    margin: "0 28px",
                    alignItems: "flex-start",
                    paddingTop: 18,
                    paddingBottom: 18,
                  }}
                >
                  <label htmlFor="f-message" style={{ paddingTop: 2 }}><b>msg&gt;</b></label>
                  <textarea
                    id="f-message"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What are you building?"
                    rows={5}
                    style={{
                      background: "none",
                      border: "none",
                      outline: "none",
                      fontFamily: "var(--font-term)",
                      fontSize: 15,
                      color: "var(--cream)",
                      flex: 1,
                      resize: "vertical",
                    }}
                  />
                </div>
                <div style={{ padding: "16px 28px 0" }}>
                  <Btn type="submit" variant="pri">
                    Send message →
                  </Btn>
                </div>
              </form>
            )}
          </div>

          {/* Links panel */}
          <div
            className="panel"
            style={{ border: "1px solid var(--line)", borderRadius: "var(--r)", overflow: "hidden" }}
          >
            {contact.links.map((link) => (
              <a key={link.label} href={link.href} className="clink">
                <span>{link.label}</span>
                <span className="clink-value">{link.value}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
