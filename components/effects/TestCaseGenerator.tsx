"use client";

import { useEffect, useRef, useState } from "react";
import { testCaseRequirement, testCaseRows } from "@/content/projects";

export default function TestCaseGenerator() {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let started = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        observer.disconnect();

        let idx = 0;
        const run = () => {
          if (idx < testCaseRows.length) {
            idx++;
            setVisibleCount(idx);
            setTimeout(run, 700);
          }
          // stop when all rows shown — no loop
        };
        run();
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        margin: "0 28px 28px",
        border: "1px solid var(--line)",
        borderRadius: 4,
        fontFamily: "var(--font-term)",
        fontSize: 12.5,
      }}
    >
      {/* Requirement prompt */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px dashed var(--line-2)",
          color: "var(--cream-2)",
        }}
      >
        <b style={{ color: "var(--amber)", fontWeight: 400 }}>requirement&gt;</b>{" "}
        {testCaseRequirement}
      </div>

      {/* Generated rows */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead className="sr-only">
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Description</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {testCaseRows.map((row, i) => (
            <tr
              key={row.id}
              style={{
                opacity: i < visibleCount ? 1 : 0,
                transform: i < visibleCount ? "none" : "translateY(6px)",
                transition: ".5s cubic-bezier(.16,1,.3,1)",
              }}
            >
              <td
                style={{
                  padding: "9px 14px",
                  borderBottom:
                    i < testCaseRows.length - 1 ? "1px solid var(--line)" : "none",
                  color: "var(--cream-3)",
                  width: 90,
                  whiteSpace: "nowrap",
                }}
              >
                {row.id}
              </td>
              <td
                style={{
                  padding: "9px 14px",
                  borderBottom:
                    i < testCaseRows.length - 1 ? "1px solid var(--line)" : "none",
                  color: "var(--cream-2)",
                }}
              >
                {row.description}
              </td>
              <td
                style={{
                  padding: "9px 14px",
                  borderBottom:
                    i < testCaseRows.length - 1 ? "1px solid var(--line)" : "none",
                  textAlign: "right",
                  color: "var(--em)",
                  width: 80,
                }}
              >
                {row.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
