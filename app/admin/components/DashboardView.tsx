// app/admin/components/DashboardView.tsx
"use client";

import { useState } from "react";
import type { Order } from "../types";
import { thStyle, tdStyle } from "../styles";

interface DashboardViewProps {
  orders: Order[];
  loading: boolean;
}

function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function getOrderAmount(order: Order): number {
  const val = (order as unknown as { total_price?: number | null }).total_price;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  return 0;
}

function getOrderDate(order: Order): Date | null {
  const raw = (order as unknown as { created_at?: string | null }).created_at;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDateDDMMMYYYY(d: Date): string {
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day}${month}${year}`;
}

type ItemsJson = Record<string, number>;
type OrderWithItemsJson = Order & {
  items_json?: ItemsJson | null;
};

function getItemsCount(order: Order): number {
  const items = (order as OrderWithItemsJson).items_json;
  if (!items || typeof items !== "object") return 0;
  let total = 0;
  for (const val of Object.values(items)) {
    if (typeof val === "number" && val > 0) {
      total += val;
    }
  }
  return total;
}

export default function DashboardView({ orders, loading }: DashboardViewProps) {
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");

  const now = new Date();

  // Today range: local midnight to next midnight
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  // Month range: first day to first day of next month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let todayRevenue = 0; // Ready + Delivered (today)
  let monthRevenue = 0; // Delivered only (this calendar month)
  let lifetimeRevenue = 0; // Delivered only (all time)

  orders.forEach((order) => {
    const d = getOrderDate(order);
    if (!d) return;
    const ts = d.getTime();
    const amt = getOrderAmount(order);
    const status = order.status;

    // Today: Ready + Delivered
    if (
      ts >= startOfDay.getTime() &&
      ts < endOfDay.getTime() &&
      (status === "READY" || status === "DELIVERED")
    ) {
      todayRevenue += amt;
    }

    // Month & Lifetime: Delivered only
    if (status === "DELIVERED") {
      lifetimeRevenue += amt;

      if (ts >= startOfMonth.getTime() && ts < endOfMonth.getTime()) {
        monthRevenue += amt;
      }
    }
  });

  // Top 3 customers by lifetime revenue (grouped by address)
  type CustomerAgg = {
    key: string;
    flat: string | null;
    block: string | null;
    society: string | null;
    total: number;
    ordersCount: number;
  };

  const customerMap = new Map<string, CustomerAgg>();

  deliveredOrders.forEach((order) => {
    const flat = (order.flat_number as unknown as string | null) ?? null;
    const block = (order as unknown as { block?: string | null }).block ?? null;
    const society =
      (order.society_name as unknown as string | null) ?? null;

    const addressKey = `${society || ""}||${block || ""}||${flat || ""}`;
    if (!addressKey.trim()) return;

    const amt = getOrderAmount(order);

    const existing = customerMap.get(addressKey);
    if (existing) {
      existing.total += amt;
      existing.ordersCount += 1;
    } else {
      customerMap.set(addressKey, {
        key: addressKey,
        flat,
        block,
        society,
        total: amt,
        ordersCount: 1,
      });
    }
  });

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const deliveredSorted = [...deliveredOrders].sort((a, b) => {
    const da = getOrderDate(a);
    const db = getOrderDate(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return db.getTime() - da.getTime(); // newest first
  });

// Month filter options based on delivered orders
const monthOptions = (() => {
  const monthFormatter = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  });

  const map = new Map<string, Date>();
  deliveredOrders.forEach((order) => {
    const d = getOrderDate(order);
    if (!d) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    // store latest date for that month so label is consistent
    const existing = map.get(key);
    if (!existing || d > existing) {
      map.set(key, d);
    }
  });

  const entries = Array.from(map.entries()).sort(([a], [b]) =>
    b.localeCompare(a)
  ); // newest month first

  return entries.map(([key, date]) => ({
    key,
    label: monthFormatter.format(date),
  }));
})();


  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");

  const filteredDelivered =
    selectedMonth === "ALL"
      ? deliveredSorted
      : deliveredSorted.filter((order) => {
          const d = getOrderDate(order);
          if (!d) return false;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
          return key === selectedMonth;
        });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {/* Today */}
        <div
          style={{
            borderRadius: 12,
            padding: 12,
            background:
              "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(15,23,42,1))",
            border: "1px solid rgba(56,189,248,0.4)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.08,
              color: "#7dd3fc",
              marginBottom: 4,
            }}
          >
            Today Revenue (Ready + Delivered)
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {formatCurrency(todayRevenue)}
          </div>
        </div>

        {/* Month */}
        <div
          style={{
            borderRadius: 12,
            padding: 12,
            background:
              "linear-gradient(135deg, rgba(74,222,128,0.18), rgba(15,23,42,1))",
            border: "1px solid rgba(74,222,128,0.4)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.08,
              color: "#6ee7b7",
              marginBottom: 4,
            }}
          >
            Month Revenue (Delivered)
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {formatCurrency(monthRevenue)}
          </div>
        </div>

        {/* Lifetime */}
        <div
          style={{
            borderRadius: 12,
            padding: 12,
            background:
              "linear-gradient(135deg, rgba(192,132,252,0.18), rgba(15,23,42,1))",
            border: "1px solid rgba(192,132,252,0.4)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.08,
              color: "#e9d5ff",
              marginBottom: 4,
            }}
          >
            Lifetime Revenue (Delivered)
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {formatCurrency(lifetimeRevenue)}
          </div>
        </div>
      </div>

      {/* Top customers */}
      <div
        style={{
          borderRadius: 12,
          padding: 12,
          backgroundColor: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Top customers (by lifetime revenue)
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            Based on delivered orders
          </div>
        </div>

        {topCustomers.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            No delivered orders yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            {topCustomers.map((c) => {
              const addressParts: string[] = [];
              if (c.flat) addressParts.push(`Flat ${c.flat}`);
              if (c.block) addressParts.push(`${c.block} Block`);
              if (c.society) addressParts.push(c.society);

              const address =
                addressParts.length > 0
                  ? addressParts.join(", ")
                  : "Unknown address";

              return (
                <div
                  key={c.key}
                  style={{
                    borderRadius: 10,
                    padding: 10,
                    background:
                      "radial-gradient(circle at top left, rgba(148,163,184,0.25), #020617)",
                    border: "1px solid #1f2937",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {address}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      marginBottom: 4,
                    }}
                  >
                    {c.ordersCount} order{c.ordersCount > 1 ? "s" : ""}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {formatCurrency(c.total)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delivered orders table */}
      <div
        style={{
          borderRadius: 12,
          padding: 12,
          backgroundColor: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Delivered orders
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
              }}
            >
              Filter by month:
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #4b5563",
                backgroundColor: "#020617",
                color: "#e5e7eb",
              }}
            >
              <option value="ALL">All months</option>
              {monthOptions.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            {loading && (
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                Loading…
              </div>
            )}
          </div>
        </div>

        {filteredDelivered.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            No delivered orders yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Address</th>
                  <th style={thStyle}>Clothes</th>
                  <th style={thStyle}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredDelivered.map((order) => {
                  const d = getOrderDate(order);
                  const dateStr = d ? formatDateDDMMMYYYY(d) : "-";

                  const block =
                    (order as unknown as { block?: string | null }).block ??
                    null;

                  const parts: string[] = [];
                  if (order.flat_number) {
                    parts.push(`Flat ${order.flat_number}`);
                  }
                  if (block) {
                    parts.push(`${block} Block`);
                  }
                  if (order.society_name) {
                    parts.push(order.society_name);
                  }
                  const address =
                    parts.length > 0 ? parts.join(", ") : "Unknown";

                  const itemCount = getItemsCount(order);

                  return (
                    <tr key={order.id}>
                      <td style={tdStyle}>{dateStr}</td>
                      <td style={tdStyle}>{address}</td>
                      <td style={tdStyle}>
                        {itemCount > 0 ? itemCount : "-"}
                      </td>
                      <td style={tdStyle}>
                        {formatCurrency(getOrderAmount(order))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
