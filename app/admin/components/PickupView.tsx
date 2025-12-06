// app/admin/components/PickupView.tsx
"use client";

import { useState } from "react";
import type { Order } from "../types";
import { thStyle, tdStyle } from "../styles";

function formatPickupDateTime(order: Order): string {
  const d = new Date(order.pickup_date);

  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = d.getFullYear();

  // Add st / nd / rd / th
  const j = day % 10;
  const k = day % 100;
  let suffix = "th";
  if (j === 1 && k !== 11) suffix = "st";
  else if (j === 2 && k !== 12) suffix = "nd";
  else if (j === 3 && k !== 13) suffix = "rd";

  const dateStr = `${day}${suffix} ${month} ${year}`;
  // pickup_slot already has "9:00 AM – 11:00 AM"
  return `${dateStr}, ${order.pickup_slot}`;
}

// Small helper to dial customer
function callCustomer(rawPhone?: string | null) {
  if (!rawPhone) {
    alert("No phone number saved for this order.");
    return;
  }

  const cleaned = rawPhone.replace(/[^0-9]/g, "");
  const withCountry = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;

  if (typeof window !== "undefined") {
    window.location.href = `tel:+${withCountry}`;
  }
}

interface Props {
  isMobile: boolean;
  loading: boolean;
  pickupOrders: Order[];
  savingMap: Record<string, boolean>;
  onPickupConfirm: (id: string) => void;
}

export default function PickupView({
  isMobile,
  loading,
  pickupOrders,
  savingMap,
  onPickupConfirm,
}: Props) {
  if (loading) {
    return (
      <div style={{ fontSize: 13, color: "#9ca3af" }}>Loading pickups…</div>
    );
  }

  if (pickupOrders.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "#9ca3af" }}>
        No pending pickups for this date (and society).
      </div>
    );
  }

  // Desktop table
  if (!isMobile) {
    return (
      <div
        style={{
          marginTop: 4,
          borderRadius: 12,
          border: "1px solid #1f2937",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 640,
              borderCollapse: "collapse",
              fontSize: 12,
            }}
          >
            <thead
              style={{
                background: "linear-gradient(to right, #020617, #111827)",
                textAlign: "left",
              }}
            >
              <tr>
                <th style={thStyle}>Society / Flat</th>
                <th style={thStyle}>Pickup slot</th>
                <th style={thStyle}>Details</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pickupOrders.map((order, index) => {
                const saving = savingMap[order.id] ?? false;
                return (
                  <tr
                    key={order.id}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#020617" : "#030712",
                    }}
                  >
                    <td style={tdStyle}>
                      <div>{order.society_name}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        Flat: {order.flat_number}
                      </div>
                    </td>
                    <td style={tdStyle}>{formatPickupDateTime(order)}</td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 11 }}>
                        {order.customer_name} – {order.phone}
                      </div>
                      {order.notes && (
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 11,
                            color: "#e5e7eb",
                          }}
                        >
                          Notes: {order.notes}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => callCustomer(order.phone as string)}
                          style={{
                            borderRadius: 999,
                            border: "1px solid #6b7280",
                            padding: "4px 10px",
                            fontSize: 11,
                            fontWeight: 500,
                            backgroundColor: "#020617",
                            color: "#e5e7eb",
                            cursor: "pointer",
                          }}
                        >
                          Call
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => onPickupConfirm(order.id)}
                          style={{
                            borderRadius: 999,
                            border: "none",
                            padding: "4px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: saving ? "not-allowed" : "pointer",
                            background:
                              "linear-gradient(to right, #f97316, #ea580c)",
                            color: "#fffbeb",
                            opacity: saving ? 0.6 : 1,
                          }}
                        >
                          {saving ? "Updating…" : "Confirm pickup"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Mobile cards
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {pickupOrders.map((order) => (
        <PickupCard
          key={order.id}
          order={order}
          saving={savingMap[order.id] ?? false}
          onPickupConfirm={onPickupConfirm}
        />
      ))}
    </div>
  );
}

function PickupCard({
  order,
  saving,
  onPickupConfirm,
}: {
  order: Order;
  saving: boolean;
  onPickupConfirm: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickupLabel = formatPickupDateTime(order);

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #111827",
        padding: 10,
        background:
          "radial-gradient(circle at top left, #111827cc, #020617)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {order.society_name}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            Flat: {order.flat_number}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            {pickupLabel}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((x) => !x)}
          style={{
            borderRadius: 999,
            border: "1px solid #374151",
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 500,
            backgroundColor: "#020617",
            color: "#e5e7eb",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {open ? "Hide details" : "View details"}
        </button>
      </div>

      {open && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 6,
            borderTop: "1px dashed #1f2937",
            fontSize: 11,
          }}
        >
          <div>
            <span style={{ color: "#9ca3af" }}>Name:</span>{" "}
            <span style={{ fontWeight: 600 }}>{order.customer_name}</span>
          </div>
          <div>
            <span style={{ color: "#9ca3af" }}>Phone:</span>{" "}
            <span>{order.phone}</span>
          </div>
          {order.notes && (
            <div style={{ marginTop: 4, color: "#e5e7eb" }}>
              Notes: {order.notes}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => callCustomer(order.phone as string)}
          style={{
            flex: 1,
            borderRadius: 999,
            border: "1px solid #6b7280",
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            backgroundColor: "#020617",
            color: "#e5e7eb",
            cursor: "pointer",
          }}
        >
          Call
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onPickupConfirm(order.id)}
          style={{
            flex: 1,
            borderRadius: 999,
            border: "none",
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            background: "linear-gradient(to right, #f97316, #ea580c)",
            color: "#fffbeb",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Updating…" : "Confirm pickup"}
        </button>
      </div>
    </div>
  );
}
