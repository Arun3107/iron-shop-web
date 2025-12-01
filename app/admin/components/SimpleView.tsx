// app/admin/components/SimpleView.tsx
"use client";

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
  const flatLine = block
    ? `Block ${block}, Flat ${order.flat_number}`
    : `Flat ${order.flat_number}`;

  return (
    `Hi! Your ironing order is READY.\n` +
    `${flatLine}, ${order.society_name}.\n` +
    `Total amount: ₹${amount}.\n` +
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
    const withCountry = cleaned.startsWith("91")
      ? cleaned
      : `91${cleaned}`;

    const url = `https://wa.me/${withCountry}?text=${encodeURIComponent(
      msg
    )}`;

    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
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
                        <button
                          type="button"
                          onClick={() => openWhatsApp(order)}
                          style={{
                            borderRadius: 999,
                            border: "1px solid #15803d",
                            padding: "4px 10px",
                            fontSize: 11,
                            fontWeight: 500,
                            backgroundColor: "#022c22",
                            color: "#bbf7d0",
                            cursor: "pointer",
                          }}
                        >
                          WhatsApp
                        </button>
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
              <button
                type="button"
                onClick={() => openWhatsApp(order)}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "1px solid #15803d",
                  padding: "6px 8px",
                  fontSize: 11,
                  fontWeight: 500,
                  backgroundColor: "#022c22",
                  color: "#bbf7d0",
                  cursor: "pointer",
                }}
              >
                WhatsApp
              </button>
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
