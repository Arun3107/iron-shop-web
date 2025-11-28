"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";

type OrderStatus = "NEW" | "PICKED" | "READY" | "DELIVERED";

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
  self_drop: boolean;
  notes: string | null;
  items_estimated_total: number | null;
  delivery_charge: number | null;
  express_charge: number | null;
  estimated_total: number | null;
  status: OrderStatus;
  total_price: number | null;
  worker_name?: string | null;
}

type AdminTab = "ORDERS" | "DASHBOARD";

const WORKERS = ["Anil", "Sikandar"];

interface Summary {
  from: string;
  to: string;
  totalOrders: number;
  totalRevenue: number;
  statusCounts: Record<OrderStatus, number>;
  revenueByWorker: Record<string, number>;
}

export default function AdminPage() {
  const [date, setDate] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [error, setError] = useState<string>("");
  const [societyFilter, setSocietyFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<AdminTab>("ORDERS");
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  // Dashboard state
  const [weekSummary, setWeekSummary] = useState<Summary | null>(null);
  const [monthSummary, setMonthSummary] = useState<Summary | null>(null);
  const [rangeSummary, setRangeSummary] = useState<Summary | null>(null);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Set default date = today
  useEffect(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    setDate(todayISO);
  }, []);

  // Load orders when date changes
  useEffect(() => {
    if (!date) return;
    void fetchOrders(date);
  }, [date]);

  // Load dashboard when switching to DASHBOARD or date changes
  useEffect(() => {
    if (activeTab !== "DASHBOARD" || !date) return;

    const week = getWeekRange(date);
    const month = getMonthRange(date);

    setSummaryLoading(true);
    (async () => {
      await Promise.all([
        fetchSummaryRange(week.from, week.to, setWeekSummary),
        fetchSummaryRange(month.from, month.to, setMonthSummary),
      ]);

      // Initialise custom range first time with current week
      if (!rangeFrom && !rangeTo) {
        setRangeFrom(week.from);
        setRangeTo(week.to);
        await fetchSummaryRange(week.from, week.to, setRangeSummary);
      }
      setSummaryLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, date]);

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
      setOrders((data.orders || []) as Order[]);
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError("Unexpected error while loading orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function setRowSaving(id: string, value: boolean) {
    setSavingMap((prev) => ({ ...prev, [id]: value }));
  }

  async function saveOrderPartial(
    id: string,
    patch: {
      status?: OrderStatus;
      worker_name?: string | null;
      total_price?: number | null;
    }
  ) {
    if (!patch || Object.keys(patch).length === 0) return;

    setRowSaving(id, true);
    setError("");

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...patch,
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
      setRowSaving(id, false);
    }
  }

  function handleStatusChange(id: string, e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as OrderStatus;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: value } : o))
    );
    void saveOrderPartial(id, { status: value });
  }

  function handleWorkerChange(id: string, e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value || null;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, worker_name: value } : o))
    );
    void saveOrderPartial(id, { worker_name: value });
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

  async function handleTotalBlur(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    await saveOrderPartial(id, {
      total_price: order.total_price ?? null,
    });
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

  async function fetchSummaryRange(
    from: string,
    to: string,
    setSummary: (s: Summary | null) => void
  ) {
    if (!from || !to) {
      setSummary(null);
      return;
    }

    try {
      const params = new URLSearchParams({
        summary: "1",
        from,
        to,
      });
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        console.error("Summary fetch error:", data);
        setError(data.error || "Failed to load dashboard summary");
        setSummary(null);
        return;
      }

      if (!data.summary) {
        setSummary(null);
        return;
      }

      setSummary(data.summary as Summary);
    } catch (err) {
      console.error("Summary request error:", err);
      setError("Unexpected error while loading dashboard summary");
      setSummary(null);
    }
  }

  async function handleRangeRefresh() {
    if (!rangeFrom || !rangeTo) return;
    setSummaryLoading(true);
    await fetchSummaryRange(rangeFrom, rangeTo, setRangeSummary);
    setSummaryLoading(false);
  }

  // Not a hook – just a helper for quick week/month range selection
  function handleQuickRange(type: "week" | "month") {
    if (!date) return;
    const base = type === "week" ? getWeekRange(date) : getMonthRange(date);
    setRangeFrom(base.from);
    setRangeTo(base.to);

    // If we already have week/month summary, reuse it immediately
    if (type === "week" && weekSummary) {
      setRangeSummary(weekSummary);
    } else if (type === "month" && monthSummary) {
      setRangeSummary(monthSummary);
    } else {
      void handleRangeRefresh();
    }
  }

  const societies = Array.from(
    new Set(orders.map((o) => o.society_name))
  ).sort();

  const filteredOrders =
    societyFilter === "ALL"
      ? orders
      : orders.filter((o) => o.society_name === societyFilter);

  // FIFO + Express first
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.express_delivery !== b.express_delivery) {
      return a.express_delivery ? -1 : 1; // express at top
    }
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return aTime - bTime; // oldest first
  });

  const totalRevenue = sortedOrders.reduce(
    (sum, o) => sum + (o.total_price || 0),
    0
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "24px 12px",
        backgroundColor: "#0f172a",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          backgroundColor: "#020617",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
          color: "white",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Iron Shop – Admin
        </h1>
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
          View all bookings, update status (NEW / PICKED / READY / DELIVERED),
          assign worker, and track revenue – optimised for both mobile and
          laptop.
        </p>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 14,
            borderBottom: "1px solid #111827",
            paddingBottom: 6,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("ORDERS")}
            style={{
              border: "none",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor:
                activeTab === "ORDERS" ? "#111827" : "transparent",
              color: activeTab === "ORDERS" ? "#e5e7eb" : "#9ca3af",
            }}
          >
            Orders
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("DASHBOARD")}
            style={{
              border: "none",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor:
                activeTab === "DASHBOARD" ? "#111827" : "transparent",
              color: activeTab === "DASHBOARD" ? "#e5e7eb" : "#9ca3af",
            }}
          >
            Dashboard (week / month / range)
          </button>
        </div>

        {/* Filters + quick summary – shown on both tabs */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <label style={filterLabelStyle}>Pickup date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={filterInputStyle}
            />
          </div>

          <div>
            <label style={filterLabelStyle}>Society</label>
            <select
              value={societyFilter}
              onChange={(e) => setSocietyFilter(e.target.value)}
              style={filterInputStyle}
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
              flexWrap: "wrap",
              gap: 8,
              fontSize: 11,
            }}
          >
            <div style={pillStyle}>
              Orders:{" "}
              <span style={{ fontWeight: 700 }}>{sortedOrders.length}</span>
            </div>
            <div style={pillStyle}>
              Revenue (this date):{" "}
              <span style={{ fontWeight: 700 }}>₹{totalRevenue}</span>
            </div>
          </div>
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

        {activeTab === "DASHBOARD" ? (
          <DashboardView
            weekSummary={weekSummary}
            monthSummary={monthSummary}
            rangeSummary={rangeSummary}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            setRangeFrom={setRangeFrom}
            setRangeTo={setRangeTo}
            summaryLoading={summaryLoading}
            onRangeRefresh={handleRangeRefresh}
            onQuickRange={handleQuickRange}
          />
        ) : (
          <OrdersView
            loading={loading}
            sortedOrders={sortedOrders}
            savingBulk={savingBulk}
            savingMap={savingMap}
            onMarkAllNewAsPicked={markAllNewAsPicked}
            onStatusChange={handleStatusChange}
            onWorkerChange={handleWorkerChange}
            onTotalChange={handleTotalChange}
            onTotalBlur={handleTotalBlur}
          />
        )}
      </div>
    </main>
  );
}

/* ---------- DASHBOARD VIEW ---------- */

function DashboardView(props: {
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
}) {
  const {
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
  } = props;

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
              <span style={{ fontWeight: 700 }}>{summary.totalOrders}</span>
            </div>
            <div style={summaryPillStyle}>
              Revenue:{" "}
              <span style={{ fontWeight: 700 }}>₹{summary.totalRevenue}</span>
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

/* ---------- ORDERS VIEW ---------- */

function OrdersView(props: {
  loading: boolean;
  sortedOrders: Order[];
  savingBulk: boolean;
  savingMap: Record<string, boolean>;
  onMarkAllNewAsPicked: () => void;
  onStatusChange: (id: string, e: ChangeEvent<HTMLSelectElement>) => void;
  onWorkerChange: (id: string, e: ChangeEvent<HTMLSelectElement>) => void;
  onTotalChange: (id: string, value: string) => void;
  onTotalBlur: (id: string) => void;
}) {
  const {
    loading,
    sortedOrders,
    savingBulk,
    savingMap,
    onMarkAllNewAsPicked,
    onStatusChange,
    onWorkerChange,
    onTotalChange,
    onTotalBlur,
  } = props;

  return (
    <>
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => void onMarkAllNewAsPicked()}
          disabled={savingBulk || loading || sortedOrders.length === 0}
          style={{
            borderRadius: 999,
            border: "none",
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 600,
            cursor:
              savingBulk || loading || sortedOrders.length === 0
                ? "not-allowed"
                : "pointer",
            background:
              "linear-gradient(to right, #f97316, #ea580c, #7c2d12)",
            color: "#fffbeb",
            opacity:
              savingBulk || loading || sortedOrders.length === 0 ? 0.6 : 1,
          }}
        >
          {savingBulk ? "Marking NEW as PICKED…" : "Mark all NEW as PICKED"}
        </button>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          Express orders are always at the top; within each group we follow FIFO
          (oldest first).
        </span>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: "#9ca3af" }}>Loading orders…</div>
      ) : sortedOrders.length === 0 ? (
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
          {/* Horizontal scroll for mobile */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 720,
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
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Worker</th>
                  <th style={thStyle}>Total price</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order, index) => {
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
                        <StatusBadge status={order.status} />
                        <select
                          value={order.status}
                          onChange={(e) => onStatusChange(order.id, e)}
                          style={{
                            marginTop: 4,
                            fontSize: 11,
                            borderRadius: 6,
                            border: "1px solid #374151",
                            backgroundColor: "#020617",
                            color: "#e5e7eb",
                            padding: "2px 6px",
                            width: "100%",
                          }}
                        >
                          <option value="NEW">NEW</option>
                          <option value="PICKED">PICKED</option>
                          <option value="READY">READY</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                        {saving && (
                          <div
                            style={{
                              marginTop: 2,
                              fontSize: 10,
                              color: "#9ca3af",
                            }}
                          >
                            Saving…
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={order.worker_name || ""}
                          onChange={(e) => onWorkerChange(order.id, e)}
                          style={{
                            fontSize: 11,
                            borderRadius: 6,
                            border: "1px solid #374151",
                            backgroundColor: "#020617",
                            color: "#e5e7eb",
                            padding: "4px 6px",
                            width: "100%",
                          }}
                        >
                          <option value="">Unassigned</option>
                          {WORKERS.map((w) => (
                            <option key={w} value={w}>
                              {w}
                            </option>
                          ))}
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
                            onTotalChange(order.id, e.target.value)
                          }
                          onBlur={() => void onTotalBlur(order.id)}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Helpers ---------- */

function StatusBadge({ status }: { status: OrderStatus }) {
  let bg = "#111827";
  let text = "#e5e7eb";

  if (status === "NEW") {
    bg = "#1d4ed8";
    text = "#dbeafe";
  } else if (status === "PICKED") {
    bg = "#f97316";
    text = "#ffedd5";
  } else if (status === "READY") {
    bg = "#a855f7";
    text = "#f5e9ff";
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

// calculate Monday–Sunday week around a date
function getWeekRange(dateStr: string): { from: string; to: string } {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    const today = new Date();
    return {
      from: today.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
    };
  }
  const day = d.getDay(); // 0=Sun, 1=Mon…
  const diffToMonday = (day + 6) % 7; // Monday=0
  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

function getMonthRange(dateStr: string): { from: string; to: string } {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    const today = new Date();
    return {
      from: today.toISOString().slice(0, 10),
      to: today.toISOString().slice(0, 10),
    };
  }
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

/* ---------- Table & filter styles ---------- */

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

const filterLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#e5e7eb",
  marginBottom: 4,
};

const filterInputStyle: CSSProperties = {
  borderRadius: 8,
  border: "1px solid #374151",
  padding: "6px 10px",
  fontSize: 13,
  backgroundColor: "#020617",
  color: "#e5e7eb",
};

const pillStyle: CSSProperties = {
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid #374151",
  background: "radial-gradient(circle at top left, #22c55e22, #22c55e0d)",
};

const summaryPillStyle: CSSProperties = {
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid #1f2937",
  backgroundColor: "#020617",
};

const rangeChipStyle: CSSProperties = {
  borderRadius: 999,
  border: "1px solid #374151",
  padding: "4px 10px",
  backgroundColor: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
};
