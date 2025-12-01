// app/admin/components/DashboardView.tsx
"use client";

import type { Summary } from "../types";
import { WORKERS } from "../constants";
import {
  filterLabelStyle,
  filterInputStyle,
  rangeChipStyle,
  summaryPillStyle,
} from "../styles";
import type { OrderStatus } from "../types";

interface Props {
  weekSummary: Summary | null;
  monthSummary: Summary | null;
  rangeSummary: Summary | null;
  rangeFrom: string;
  rangeTo: string;
  setRangeFrom: (v: string) => void;
  setRangeTo: (v: string) => void;
  summaryLoading: boolean;
  onRangeRefresh: () => void;
  onQuickRange: (t: "week" | "month") => void;
}

export default function DashboardView({
  weekSummary,
  monthSummary,
  rangeSummary,
  rangeFrom,
  rangeTo,
  setRangeFrom,
  setRangeTo,
  summaryLoading,
  onRangeRefresh,
  onQuickRange,
}: Props) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <p style={{ fontSize: 12, color: "#9ca3af" }}>
        Use this tab to see summary for the{" "}
        <strong>current week, month, and any custom date range</strong>. This
        helps you quickly check total orders and revenue, and also revenue by
        worker (Anil / Sikandar).
      </p>

      {summaryLoading && (
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          Refreshing dashboard summary…
        </div>
      )}

      {/* Week + Month cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
        }}
      >
        <SummaryCard label="This week" summary={weekSummary} />
        <SummaryCard label="This month" summary={monthSummary} />
      </div>

      {/* Custom range */}
      <div
        style={{
          marginTop: 6,
          borderRadius: 12,
          border: "1px solid #1f2937",
          padding: 12,
          background:
            "radial-gradient(circle at top left, #4f46e533, #020617)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <div style={filterLabelStyle}>From (pickup date)</div>
            <input
              type="date"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              style={filterInputStyle}
            />
          </div>
          <div>
            <div style={filterLabelStyle}>To (pickup date)</div>
            <input
              type="date"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              style={filterInputStyle}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              fontSize: 11,
            }}
          >
            <button
              type="button"
              onClick={() => onQuickRange("week")}
              style={rangeChipStyle}
            >
              This week
            </button>
            <button
              type="button"
              onClick={() => onQuickRange("month")}
              style={rangeChipStyle}
            >
              This month
            </button>
          </div>

          <button
            type="button"
            onClick={onRangeRefresh}
            style={{
              marginLeft: "auto",
              borderRadius: 999,
              border: "none",
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              background:
                "linear-gradient(to right, #22c55e, #16a34a, #166534)",
              color: "#022c22",
            }}
          >
            Show range summary
          </button>
        </div>

        <SummaryCard label="Custom range" summary={rangeSummary} />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  summary,
}: {
  label: string;
  summary: Summary | null;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #1f2937",
        padding: 10,
        background:
          "radial-gradient(circle at top left, #0f766e33, #020617)",
      }}
    >
      <h2
        style={{
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </h2>
      {!summary ? (
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          No data loaded for this range yet.
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: 11,
              color: "#9ca3af",
              marginBottom: 6,
            }}
          >
            {summary.from} → {summary.to}
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <div style={summaryPillStyle}>
              Orders:{" "}
              <span style={{ fontWeight: 700 }}>
                {summary.totalOrders}
              </span>
            </div>
            <div style={summaryPillStyle}>
              Revenue:{" "}
              <span style={{ fontWeight: 700 }}>
                ₹{summary.totalRevenue}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: 8,
              fontSize: 11,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Orders by status
              </div>
              {(["NEW", "PICKED", "READY", "DELIVERED"] as OrderStatus[]).map(
                (st) => (
                  <div
                    key={st}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "2px 0",
                    }}
                  >
                    <span>{st}</span>
                    <span style={{ fontWeight: 600 }}>
                      {summary.statusCounts[st] ?? 0}
                    </span>
                  </div>
                )
              )}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Revenue by worker
              </div>
              {WORKERS.map((w) => (
                <div
                  key={w}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "2px 0",
                  }}
                >
                  <span>{w}</span>
                  <span style={{ fontWeight: 600 }}>
                    ₹{summary.revenueByWorker[w] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
