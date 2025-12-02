// app/admin/components/SimpleView.tsx
"use client";

import React, { useState } from "react";
import type { Order } from "../types";
import { thStyle, tdStyle } from "../styles";
import { StatusBadge } from "../helpers";

interface Props {
  isMobile: boolean;
  loading: boolean;
  sortedOrders: Order[];
  // callback from parent to change status to DELIVERED
  onMarkDelivered: (orderId: string) => void;
}

type OrderWithPhone = Order & {
  phone?: string;
  phone_number?: string;
  mobile?: string;
};

type OrderWithBlock = Order & {
  block?: string | null;
};

type ItemsJson = Record<string, number>;
type OrderWithItemsJson = Order & {
  items_json?: ItemsJson | null;
};

// Try to pull a phone number from the order (field name may vary)
function getOrderPhone(order: Order): string | null {
  const o = order as OrderWithPhone;
  return o.phone ?? o.phone_number ?? o.mobile ?? null;
}

function getOrderBlock(order: Order): string {
  const o = order as OrderWithBlock;
  return (o.block ?? "").toString().trim();
}

function buildWhatsappMessage(order: Order): string {
  const amount = order.total_price ?? 0;
  const block = getOrderBlock(order);

  // Line with block/flat/society
  const flatLine = block
    ? `Block ${block}, Flat ${order.flat_number}, ${order.society_name}.`
    : `Flat ${order.flat_number}, ${order.society_name}.`;

  // Build item summary from order.items_json (how you already store counts)
  let summaryText = "No detailed breakdown available.";

  const rawItems = (order as OrderWithItemsJson).items_json;

  if (rawItems && typeof rawItems === "object") {
    const entries = Object.entries(rawItems).filter(
      ([, val]) => typeof val === "number" && (val as number) > 0
    ) as [string, number][];

    if (entries.length > 0) {
      const summaryLines = entries.map(([key, qty]) => {
        // key is like "men_shirt_kurta_tshirt" – we can make it a bit nicer
        const niceKey = key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return `${niceKey}: ${qty} pcs`;
      });

      summaryText = summaryLines.join("\n");
    }
  }

  // Create UPI link (clickable in WhatsApp)
  const upiId = "7406660311@upi";
  const upiLink =
    `https://upi.link/pay?pa=${encodeURIComponent(upiId)}` +
    `&am=${amount}&cu=INR` +
    `&tn=${encodeURIComponent(`Ironing order - ${order.flat_number}`)}`;

  return (
    `Hi! Your ironing order is Ready and we will deliver it in the evening slot.\n` +
    `${flatLine}\n` +
    `Total amount: ₹${amount}.\n\n` +
    `Click here to pay:\n${upiLink}\n\n` +
    `Detailed Summary:\n${summaryText}\n\n` +
    `Thank you!`
  );
}

// Block ordering A → G for PSR Aster
const BLOCK_PRIORITY: Record<string, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
};

function getBlockSortKey(order: Order): number {
  const raw = getOrderBlock(order).toUpperCase();
  if (!raw) return 999; // unknown / unset block at the end
  const letter = raw[0]; // "A", "B", etc.
  const rank = BLOCK_PRIORITY[letter];
  return rank === undefined ? 999 : rank;
}

export default function SimpleView({
  isMobile,
  loading,
  sortedOrders,
  onMarkDelivered,
}: Props) {
  // Track which orders have been notified via WhatsApp
  const [notified, setNotified] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div style={{ fontSize: 13, color: "#9ca3af" }}>
        Loading ready orders…
      </div>
    );
  }

  // Only show READY orders in this tab
  const readyOrders = sortedOrders.filter((o) => o.status === "READY");

  if (readyOrders.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "#9ca3af" }}>
        No ready orders right now.
      </div>
    );
  }

  // Sort:
  // - For PSR Aster: by Block (A → G), then by created_at (FIFO inside each block)
  // - For other societies: by created_at (FIFO)
  const ordered = [...readyOrders].sort((a, b) => {
    const aIsPSR = a.society_name === "PSR Aster";
    const bIsPSR = b.society_name === "PSR Aster";

    // If both are PSR Aster, sort by block first
    if (aIsPSR && bIsPSR) {
      const blockDiff = getBlockSortKey(a) - getBlockSortKey(b);
      if (blockDiff !== 0) return blockDiff;
    }

    // Fallback: FIFO by created_at
    return (
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
    );
  });

  const openWhatsApp = (order: Order) => {
    const phone = getOrderPhone(order);
    if (!phone) {
      alert("No phone number saved for this order.");
      return;
    }

    const msg = buildWhatsappMessage(order);
    const cleaned = phone.replace(/[^0-9]/g, "");
    const withCountry = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;

    const url = `whatsapp://send?phone=${withCountry}&text=${encodeURIComponent(
      msg
    )}`;

    if (typeof window !== "undefined") {
      // Open WhatsApp using the native URL scheme
      window.open(url, "_blank");
    }

    // Mark this order as notified (so button becomes grey + text shows)
    setNotified((prev) => ({
      ...prev,
      [order.id]: true,
    }));
  };

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
              minWidth: 520,
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
                <th style={thStyle}>Flat / Society</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((order, index) => {
                const amount = order.total_price ?? null;
                const block = getOrderBlock(order);
                const flatLine = block
                  ? `Block ${block} · Flat ${order.flat_number}`
                  : `Flat ${order.flat_number}`;
                const sent = !!notified[order.id];

                return (
                  <tr
                    key={order.id}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#020617" : "#030712",
                    }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {flatLine}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        {order.society_name}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {amount === null ? "—" : `₹${amount}`}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {/* WhatsApp button + "Notification sent" text */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <button
                            type="button"
                            disabled={sent}
                            onClick={() => {
                              if (!sent) openWhatsApp(order);
                            }}
                            style={{
                              borderRadius: 999,
                              border: sent
                                ? "1px solid #6b7280"
                                : "1px solid #15803d",
                              padding: "4px 10px",
                              fontSize: 11,
                              fontWeight: 500,
                              backgroundColor: sent ? "#374151" : "#022c22",
                              color: sent ? "#9ca3af" : "#bbf7d0",
                              cursor: sent ? "default" : "pointer",
                              opacity: sent ? 0.6 : 1,
                            }}
                          >
                            {sent ? "Sent" : "WhatsApp"}
                          </button>
                          {sent && (
                            <div
                              style={{
                                fontSize: 10,
                                marginTop: 3,
                                color: "#9ca3af",
                              }}
                            >
                              Notification sent
                            </div>
                          )}
                        </div>

                        {/* Mark delivered */}
                        <button
                          type="button"
                          onClick={() => onMarkDelivered(order.id)}
                          style={{
                            borderRadius: 999,
                            border: "none",
                            padding: "4px 10px",
                            fontSize: 11,
                            fontWeight: 500,
                            background:
                              "linear-gradient(to right, #4ade80, #22c55e)",
                            color: "#022c22",
                            cursor: "pointer",
                          }}
                        >
                          Mark delivered
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
      {ordered.map((order) => {
        const amount = order.total_price ?? null;
        const block = getOrderBlock(order);
        const flatLine = block
          ? `Block ${block} · Flat ${order.flat_number}`
          : `Flat ${order.flat_number}`;
        const sent = !!notified[order.id];

        return (
          <div
            key={order.id}
            style={{
              borderRadius: 12,
              border: "1px solid #1f2937",
              padding: 10,
              background:
                "radial-gradient(circle at top left, #111827cc, #020617)",
              fontSize: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{flatLine}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {order.society_name}
                </div>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div style={{ fontSize: 11, color: "#9ca3af" }}>Amount</div>
            <div
              style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}
            >
              {amount === null ? "—" : `₹${amount}`}
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "space-between",
              }}
            >
              {/* WhatsApp button + notification text */}
              <div style={{ flex: 1 }}>
                <button
                  type="button"
                  disabled={sent}
                  onClick={() => {
                    if (!sent) openWhatsApp(order);
                  }}
                  style={{
                    width: "100%",
                    borderRadius: 999,
                    border: sent
                      ? "1px solid #6b7280"
                      : "1px solid #15803d",
                    padding: "6px 8px",
                    fontSize: 11,
                    fontWeight: 500,
                    backgroundColor: sent ? "#374151" : "#022c22",
                    color: sent ? "#9ca3af" : "#bbf7d0",
                    cursor: sent ? "default" : "pointer",
                    opacity: sent ? 0.6 : 1,
                  }}
                >
                  {sent ? "Sent" : "WhatsApp"}
                </button>
                {sent && (
                  <div
                    style={{
                      fontSize: 10,
                      color: "#9ca3af",
                      marginTop: 3,
                      textAlign: "center",
                    }}
                  >
                    Notification sent
                  </div>
                )}
              </div>

              {/* Mark delivered */}
              <button
                type="button"
                onClick={() => onMarkDelivered(order.id)}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "none",
                  padding: "6px 8px",
                  fontSize: 11,
                  fontWeight: 500,
                  background:
                    "linear-gradient(to right, #4ade80, #22c55e)",
                  color: "#022c22",
                  cursor: "pointer",
                }}
              >
                Mark delivered
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
