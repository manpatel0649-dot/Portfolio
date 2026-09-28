"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { contact } from "@/content/contact";
import Btn from "@/components/ui/Btn";

const schema = z.object({
  name:    z.string().min(1, "Name is required").max(100),
  email:   z.string().email("Valid email required"),
  message: z.string().min(1, "Message is required").max(2000),
});
type Fields = z.infer<typeof schema>;

function mailtoLink(name: string, email: string, message: string) {
  const s = encodeURIComponent(`Portfolio contact from ${name}`);
  const b = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
  return `mailto:manpatel0649@gmail.com?subject=${s}&body=${b}`;
}

export default function Contact() {
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } =
    useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    try {
      const res  = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      const json = await res.json();

      if (json.fallback) {
        window.location.href = mailtoLink(data.name, data.email, data.message);
        return;
      }
      if (!res.ok) {
        toast.error(typeof json.error === "string" ? json.error : "Something went wrong.");
        return;
      }
      setSent(true);
      toast.success("Message sent! I'll reply within 24 hours.");
    } catch {
      toast.error("Network error — use the mailto link below.");
    }
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
          style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 40, alignItems: "start" }}
          className="contact-grid"
        >
          {/* Form panel */}
          <div className="panel corner">
            <div className="bar">
              <span>{contact.form.barLeft}</span>
              <span>{contact.form.barRight}</span>
            </div>

            {sent ? (
              <div style={{ padding: "48px 28px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 24, marginBottom: 12 }}>
                  Message <i style={{ color: "var(--em)" }}>sent</i>
                </div>
                <p style={{ fontSize: 14, color: "var(--cream-2)" }}>
                  I&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ padding: "8px 0 24px" }}>
                <div className="form-field" style={{ margin: "0 28px" }}>
                  <label htmlFor="f-name"><b>name&gt;</b></label>
                  <input
                    id="f-name"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    {...register("name")}
                    style={{ background: "none", border: "none", outline: "none", fontFamily: "var(--font-term)", fontSize: 15, color: "var(--cream)", flex: 1 }}
                  />
                </div>
                {errors.name && (
                  <p style={{ margin: "2px 28px 4px", fontSize: 11, color: "#f87171", fontFamily: "var(--font-mono)" }}>
                    {errors.name.message}
                  </p>
                )}

                <div className="form-field" style={{ margin: "0 28px" }}>
                  <label htmlFor="f-email"><b>email&gt;</b></label>
                  <input
                    id="f-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register("email")}
                    style={{ background: "none", border: "none", outline: "none", fontFamily: "var(--font-term)", fontSize: 15, color: "var(--cream)", flex: 1 }}
                  />
                </div>
                {errors.email && (
                  <p style={{ margin: "2px 28px 4px", fontSize: 11, color: "#f87171", fontFamily: "var(--font-mono)" }}>
                    {errors.email.message}
                  </p>
                )}

                <div className="form-field" style={{ margin: "0 28px", alignItems: "flex-start", paddingTop: 18, paddingBottom: 18 }}>
                  <label htmlFor="f-msg" style={{ paddingTop: 2 }}><b>msg&gt;</b></label>
                  <textarea
                    id="f-msg"
                    placeholder="What are you building?"
                    rows={5}
                    {...register("message")}
                    style={{ background: "none", border: "none", outline: "none", fontFamily: "var(--font-term)", fontSize: 15, color: "var(--cream)", flex: 1, resize: "vertical" }}
                  />
                </div>
                {errors.message && (
                  <p style={{ margin: "2px 28px 4px", fontSize: 11, color: "#f87171", fontFamily: "var(--font-mono)" }}>
                    {errors.message.message}
                  </p>
                )}

                <div style={{ padding: "16px 28px 0", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <Btn type="submit" variant="pri" disabled={isSubmitting}>
                    {isSubmitting ? "Sending…" : "Send message →"}
                  </Btn>
                  <a
                    href={mailtoLink(getValues("name") ?? "", getValues("email") ?? "", getValues("message") ?? "")}
                    style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--cream-3)", textDecoration: "underline" }}
                  >
                    or open in email client
                  </a>
                </div>
              </form>
            )}
          </div>

          {/* Links panel */}
          <div className="panel" style={{ border: "1px solid var(--line)", borderRadius: "var(--r)", overflow: "hidden" }}>
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
