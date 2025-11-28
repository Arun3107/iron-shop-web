"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";

type OrderStatus = "NEW" | "PICKED" | "DELIVERED";

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  society_name: string;
  flat_number: string;
  pickup_date: string;
  pickup_slot: string;
  express_delivery: boolean;
  self_drop: boolean; // 👈 NEW
  notes: string | null;
  items_estimated_total: number | null;
  delivery_charge: number | null;
  express_charge: number | null;
  estimated_total: number | null;
  status: OrderStatus;
  total_price: number | null;
}


export default function AdminPage() {
  const [date, setDate] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingBulk, setSavingBulk] = useState(false);
  const [error, setError] = useState<string>("");
  const [societyFilter, setSocietyFilter] = useState<string>("ALL");

  // Set default date = today
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Load orders when date changes
  useEffect(() => {
    if (!date) return;
    void fetchOrders(date);
  }, [date]);

  async function fetchOrders(d: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders?date=${d}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load orders");
        setOrders([]);
        return;
      }
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError("Unexpected error while loading orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(id: string, e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as OrderStatus;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: value } : o))
    );
  }

  function handleTotalChange(id: string, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    const num = cleaned ? parseInt(cleaned, 10) : NaN;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              total_price: Number.isNaN(num) ? null : num,
            }
          : o
      )
    );
  }

  async function handleSave(order: Order) {
    setSavingId(order.id);
    setError("");

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          status: order.status,
          total_price: order.total_price ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Update order error:", data);
        setError(data.error || "Failed to update order");
        return;
      }

      const updated: Order = data.order;
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
    } catch (err) {
      console.error("Update order request error:", err);
      setError("Unexpected error while updating order");
    } finally {
      setSavingId(null);
    }
  }

  async function markAllNewAsPicked() {
    setError("");

    const relevant = filteredOrders.filter((o) => o.status === "NEW");
    if (relevant.length === 0) {
      setError("No NEW orders in this view to mark as PICKED.");
      return;
    }

    const ids = relevant.map((o) => o.id);

    setSavingBulk(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids,
          status: "PICKED",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Bulk update error:", data);
        setError(data.error || "Failed to update orders");
        return;
      }

      const updated: Order[] = data.orders || [];
      setOrders((prev) =>
        prev.map((o) => {
          const match = updated.find((u) => u.id === o.id);
          return match ? match : o;
        })
      );
    } catch (err) {
      console.error("Bulk update request error:", err);
      setError("Unexpected error while updating orders");
    } finally {
      setSavingBulk(false);
    }
  }

  const societies = Array.from(
    new Set(orders.map((o) => o.society_name))
  ).sort();

  const filteredOrders =
    societyFilter === "ALL"
      ? orders
      : orders.filter((o) => o.society_name === societyFilter);

  const totalRevenue = filteredOrders.reduce(
    (sum, o) => sum + (o.total_price || 0),
    0
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "24px 16px",
        backgroundColor: "#0f172a",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          backgroundColor: "#020617",
          borderRadius: 18,
          padding: 20,
          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
          color: "white",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Iron Shop – Admin Dashboard
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
          View all bookings for a day, update status (NEW / PICKED /
          DELIVERED), and record final total price for revenue tracking.
        </p>

        {/* Filters + summary */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#e5e7eb",
                marginBottom: 4,
              }}
            >
              Pickup date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                borderRadius: 8,
                border: "1px solid #374151",
                padding: "6px 10px",
                fontSize: 13,
                backgroundColor: "#020617",
                color: "#e5e7eb",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: "#e5e7eb",
                marginBottom: 4,
              }}
            >
              Society
            </label>
            <select
              value={societyFilter}
              onChange={(e) => setSocietyFilter(e.target.value)}
              style={{
                borderRadius: 8,
                border: "1px solid #374151",
                padding: "6px 10px",
                fontSize: 13,
                backgroundColor: "#020617",
                color: "#e5e7eb",
              }}
            >
              <option value="ALL">All societies</option>
              {societies.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 12,
              fontSize: 12,
            }}
          >
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #374151",
                background:
                  "radial-gradient(circle at top left, #22c55e33, #22c55e11)",
              }}
            >
              Orders:{" "}
              <span style={{ fontWeight: 700 }}>{filteredOrders.length}</span>
            </div>
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #374151",
                background:
                  "radial-gradient(circle at top left, #3b82f633, #1d4ed811)",
              }}
            >
              Total revenue:{" "}
              <span style={{ fontWeight: 700 }}>₹{totalRevenue}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginBottom: 10,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={() => void markAllNewAsPicked()}
            disabled={savingBulk || loading || filteredOrders.length === 0}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              cursor:
                savingBulk || loading || filteredOrders.length === 0
                  ? "not-allowed"
                  : "pointer",
              background:
                "linear-gradient(to right, #f97316, #ea580c, #7c2d12)",
              color: "#fffbeb",
              opacity:
                savingBulk || loading || filteredOrders.length === 0 ? 0.6 : 1,
            }}
          >
            {savingBulk ? "Marking NEW as PICKED…" : "Mark all NEW as PICKED"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 10,
              fontSize: 12,
              color: "#fecaca",
              backgroundColor: "#7f1d1d",
              borderRadius: 8,
              padding: "6px 8px",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ fontSize: 13, color: "#9ca3af" }}>
            Loading orders…
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ fontSize: 13, color: "#9ca3af" }}>
            No orders for this date (and society) yet.
          </div>
        ) : (
          <div
            style={{
              marginTop: 4,
              borderRadius: 12,
              border: "1px solid #1f2937",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
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
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Society / Flat</th>
                  <th style={thStyle}>Slot</th>
                  <th style={thStyle}>Est. total</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Total price</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#020617" : "#030712",
                    }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>
                        {order.customer_name}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        {order.phone}
                      </div>
                      {order.notes && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#e5e7eb",
                            marginTop: 2,
                          }}
                        >
                          Notes: {order.notes}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div>{order.society_name}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        Flat: {order.flat_number}
                      </div>
                    </td>
                    <td style={tdStyle}>
  <div>{order.pickup_slot}</div>
  {order.express_delivery && (
    <div
      style={{
        marginTop: 2,
        fontSize: 11,
        color: "#f97316",
      }}
    >
      Express
    </div>
  )}
  {order.self_drop && (
    <div
      style={{
        marginTop: 2,
        fontSize: 11,
        color: "#22c55e",
      }}
    >
      Self drop
    </div>
  )}
</td>

                    <td style={tdStyle}>
                      {order.estimated_total != null ? (
                        <>
                          <div>₹{order.estimated_total}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            (Items: ₹{order.items_estimated_total || 0}
                            {order.delivery_charge
                              ? ` + Del: ₹${order.delivery_charge}`
                              : ""}
                            {order.express_charge
                              ? ` + Exp: ₹${order.express_charge}`
                              : ""}
                            )
                          </div>
                        </>
                      ) : (
                        <span style={{ color: "#6b7280" }}>N/A</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={order.status} />
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e)
                        }
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          borderRadius: 6,
                          border: "1px solid #374151",
                          backgroundColor: "#020617",
                          color: "#e5e7eb",
                          padding: "2px 6px",
                        }}
                      >
                        <option value="NEW">NEW</option>
                        <option value="PICKED">PICKED</option>
                        <option value="DELIVERED">DELIVERED</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={
                          order.total_price != null
                            ? String(order.total_price)
                            : ""
                        }
                        onChange={(e) =>
                          handleTotalChange(order.id, e.target.value)
                        }
                        placeholder="₹"
                        style={{
                          width: "100%",
                          borderRadius: 6,
                          border: "1px solid #374151",
                          backgroundColor: "#020617",
                          color: "#e5e7eb",
                          fontSize: 11,
                          padding: "4px 6px",
                        }}
                      />
                    </td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => void handleSave(order)}
                        disabled={savingId === order.id}
                        style={{
                          borderRadius: 999,
                          border: "none",
                          padding: "6px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: savingId === order.id ? "wait" : "pointer",
                          background:
                            "linear-gradient(to right, #22c55e, #16a34a)",
                          color: "#022c22",
                          opacity: savingId === order.id ? 0.7 : 1,
                        }}
                      >
                        {savingId === order.id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  let bg = "#111827";
  let text = "#e5e7eb";
  if (status === "NEW") {
    bg = "#1d4ed8";
    text = "#dbeafe";
  } else if (status === "PICKED") {
    bg = "#f97316";
    text = "#ffedd5";
  } else if (status === "DELIVERED") {
    bg = "#16a34a";
    text = "#dcfce7";
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        backgroundColor: bg,
        color: text,
      }}
    >
      {status}
    </span>
  );
}

/* ---------- Table styles ---------- */

const thStyle: CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #1f2937",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.05,
  color: "#9ca3af",
};

const tdStyle: CSSProperties = {
  padding: "8px 10px",
  borderTop: "1px solid #111827",
  verticalAlign: "top",
};
