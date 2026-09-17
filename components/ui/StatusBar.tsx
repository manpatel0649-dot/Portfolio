"use client";

import { useEffect, useRef, useState } from "react";

export default function StatusBar() {
  const [time, setTime] = useState("");
  const [agents, setAgents] = useState(3);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const t = setInterval(updateTime, 30_000);

    const agentTimer = setInterval(() => {
      setAgents(2 + Math.floor(Math.random() * 3));
    }, 4_000);

    // Scroll progress bar
    const updateProgress = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
      rafRef.current = requestAnimationFrame(updateProgress);
    };
    rafRef.current = requestAnimationFrame(updateProgress);

    return () => {
      clearInterval(t);
      clearInterval(agentTimer);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      style={{
        borderBottom: "1px solid var(--line)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: "var(--cream-3)",
      }}
    >
      <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 34, gap: 16 }}>
        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="avail-dot" />
            Available for projects
          </span>
          <span style={{ color: "var(--cream-3)" }} className="hidden-mobile">
            Gujarat, IN · {time} IST
          </span>
        </div>
        <div style={{ display: "flex", gap: 26, alignItems: "center" }} className="hidden-mobile">
          <span>Model: online</span>
          <span>
            Agents: <span>{agents}</span> running
          </span>
          <span>v2026.09</span>
        </div>
      </div>

      {/* Thin emerald scroll-progress bar */}
      <div
        className="progress-bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
