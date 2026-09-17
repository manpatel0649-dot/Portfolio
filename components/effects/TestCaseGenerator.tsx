"use client";

import { useEffect, useState } from "react";
import { testCaseRequirement, testCaseRows } from "@/content/projects";

export default function TestCaseGenerator() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let idx = 0;

    const run = () => {
      if (idx < testCaseRows.length) {
        idx++;
        setVisibleCount(idx);
        setTimeout(run, 700);
      } else {
        // Reset after pause
        setTimeout(() => {
          setVisibleCount(0);
          idx = 0;
          setTimeout(run, 400);
        }, 3200);
      }
    };

    run();
  }, []);

  return (
    <div
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
