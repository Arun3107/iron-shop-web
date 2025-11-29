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

type AdminTab = "ORDERS" | "PICKUP" | "DASHBOARD";

const WORKERS = ["Anil", "Sikandar"];
const DISCOUNT_OPTIONS = [0, 5, 10, 20];

const ITEM_PRICES: Record<string, { label: string; price: number }> = {
  shirt_pant_kurta_top: {
    label: "Shirt / Pant / Kurta / Top",
    price: 10,
  },
  kids_wear: {
    label: "Kids wear (below 5)",
    price: 8,
  },
  cushion_towel: {
    label: "Cushion cover / small towel",
    price: 5,
  },
  bedsheet_single: {
    label: "Bedsheet single",
    price: 30,
  },
  bedsheet_double: {
    label: "Bedsheet double",
    price: 45,
  },
  saree_simple: {
    label: "Simple saree",
    price: 45,
  },
  saree_heavy: {
    label: "Heavy / Silk saree",
    price: 60,
  },
  coat_jacket: {
    label: "Coat / Blazer / Jacket",
    price: 50,
  },
};

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
  const [isMobile, setIsMobile] = useState(false);

  // Walk-in order state
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSociety, setNewSociety] = useState("");
  const [newExpress, setNewExpress] = useState(false);
  const [creatingWalkIn, setCreatingWalkIn] = useState(false);

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

  // Detect mobile width
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      setIsMobile(window.innerWidth < 768);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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

  function handleStatusChange(id: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    void saveOrderPartial(id, { status });
  }

  function handleWorkerChange(id: string, worker: string | null) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, worker_name: worker } : o))
    );
    void saveOrderPartial(id, { worker_name: worker });
  }

  async function handleTotalUpdate(id: string, total: number | null) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, total_price: total } : o))
    );
    await saveOrderPartial(id, { total_price: total });
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

  // Quick week/month range selection for custom card
  function handleQuickRange(type: "week" | "month") {
    if (!date) return;
    const base = type === "week" ? getWeekRange(date) : getMonthRange(date);
    setRangeFrom(base.from);
    setRangeTo(base.to);

    if (type === "week" && weekSummary) {
      setRangeSummary(weekSummary);
    } else if (type === "month" && monthSummary) {
      setRangeSummary(monthSummary);
    } else {
      void handleRangeRefresh();
    }
  }

  async function handlePickupConfirm(id: string) {
    // Called from Pickup tab button
    const match = orders.find((o) => o.id === id);
    if (!match || match.status !== "NEW") return;
    handleStatusChange(id, "PICKED");
  }

  async function handleCreateWalkInOrder() {
    if (!date) {
      setError("Please select a pickup date first.");
      return;
    }
    if (!newSociety) {
      setError("Please select a society for the walk-in order.");
      return;
    }

    setCreatingWalkIn(true);
    setError("");

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: "Walk-in customer",
          phone: newPhone || "",
          society_name: newSociety,
          flat_number: newCustomerName || "Walk-in",
          pickup_date: date,
          pickup_slot: "Self drop",
          express_delivery: newExpress,
          self_drop: true,
          status: "PICKED",
          notes: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Create order error:", data);
        setError(data.error || "Failed to create walk-in order");
        return;
      }

      const created: Order = data.order;
      setOrders((prev) => [created, ...prev]);

      setNewCustomerName("");
      setNewPhone("");
      setNewSociety("");
      setNewExpress(false);
    } catch (err) {
      console.error("Create order request error:", err);
      setError("Unexpected error while creating walk-in order");
    } finally {
      setCreatingWalkIn(false);
    }
  }

  const societies = Array.from(
    new Set(orders.map((o) => o.society_name))
  ).sort();

  const filteredOrders =
    societyFilter === "ALL"
      ? orders
      : orders.filter((o) => o.society_name === societyFilter);

  // FIFO + Express first (for this date + society)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.express_delivery !== b.express_delivery) {
      return a.express_delivery ? -1 : 1; // express at top
    }
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return aTime - bTime; // oldest first
  });

  // Pending = everything that is NOT DELIVERED
  const pendingOrders = sortedOrders.filter(
    (o) => o.status !== "DELIVERED"
  );

  // Numbers at the top (Orders / Revenue) match the current tab:
  // - Orders tab  -> pending only
  // - Pickup tab  -> all for that date/society
  // - Dashboard   -> has its own totals
  const ordersForStats =
    activeTab === "ORDERS" ? pendingOrders : sortedOrders;

  const totalRevenue = ordersForStats.reduce(
    (sum, o) => sum + (o.total_price || 0),
    0
  );

  // For Pickup tab we still want NEW + doorstep, regardless of pending filter
  const pickupOrders = sortedOrders.filter(
    (o) => o.status === "NEW" && !o.self_drop
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
          View bookings, plan pickups, update status, and track revenue – fully
          optimised for mobile use by your team.
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
            onClick={() => setActiveTab("PICKUP")}
            style={{
              border: "none",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor:
                activeTab === "PICKUP" ? "#111827" : "transparent",
              color: activeTab === "PICKUP" ? "#e5e7eb" : "#9ca3af",
            }}
          >
            Pickup
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
            Dashboard
          </button>
        </div>

        {/* Filters + quick summary – shown on Orders & Pickup */}
        {activeTab !== "DASHBOARD" && (
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
                <span style={{ fontWeight: 700 }}>{ordersForStats.length}</span>
              </div>

              <div style={pillStyle}>
                Revenue (this date):{" "}
                <span style={{ fontWeight: 700 }}>₹{totalRevenue}</span>
              </div>
            </div>
          </div>
        )}

        {/* Walk-in order form (Orders tab only) */}
        {activeTab === "ORDERS" && (
          <div
            style={{
              marginBottom: 12,
              borderRadius: 12,
              border: "1px solid #1f2937",
              padding: 10,
              background:
                "radial-gradient(circle at top left, #4f46e533, #020617)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Add walk-in order
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                For customers who directly come to the shop.
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 8,
                fontSize: 12,
              }}
            >
              <div>
                <label style={filterLabelStyle}>Flat number</label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="G-7, B-203, etc."
                  style={filterInputStyle}
                />
              </div>
              <div>
                <label style={filterLabelStyle}>Phone number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  style={filterInputStyle}
                />
              </div>
              <div>
                <label style={filterLabelStyle}>Society</label>
                <select
                  value={newSociety}
                  onChange={(e) => setNewSociety(e.target.value)}
                  style={filterInputStyle}
                >
                  <option value="">Select society</option>
                  {societies.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 20,
                }}
              >
                <input
                  id="walkin-express"
                  type="checkbox"
                  checked={newExpress}
                  onChange={(e) => setNewExpress(e.target.checked)}
                />
                <label
                  htmlFor="walkin-express"
                  style={{ fontSize: 12, cursor: "pointer" }}
                >
                  Express order
                </label>
              </div>
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => void handleCreateWalkInOrder()}
                disabled={creatingWalkIn}
                style={{
                  borderRadius: 999,
                  border: "none",
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: creatingWalkIn ? "not-allowed" : "pointer",
                  background:
                    "linear-gradient(to right, #22c55e, #16a34a, #15803d)",
                  color: "#022c22",
                  opacity: creatingWalkIn ? 0.6 : 1,
                }}
              >
                {creatingWalkIn ? "Adding…" : "Add walk-in order"}
              </button>
            </div>
          </div>
        )}

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
        ) : activeTab === "PICKUP" ? (
          <PickupView
            isMobile={isMobile}
            loading={loading}
            pickupOrders={pickupOrders}
            savingMap={savingMap}
            onPickupConfirm={handlePickupConfirm}
          />
        ) : (
          <OrdersView
            isMobile={isMobile}
            loading={loading}
            sortedOrders={pendingOrders}
            savingBulk={savingBulk}
            savingMap={savingMap}
            onMarkAllNewAsPicked={markAllNewAsPicked}
            onStatusChange={handleStatusChange}
            onWorkerChange={handleWorkerChange}
            onTotalUpdate={handleTotalUpdate}
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

/* ---------- PICKUP VIEW ---------- */

function PickupView(props: {
  isMobile: boolean;
  loading: boolean;
  pickupOrders: Order[];
  savingMap: Record<string, boolean>;
  onPickupConfirm: (id: string) => void;
}) {
  const { isMobile, loading, pickupOrders, savingMap, onPickupConfirm } =
    props;

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
                <th style={thStyle}>Express</th>
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
                    <td style={tdStyle}>{order.pickup_slot}</td>
                    <td style={tdStyle}>
                      {order.express_delivery ? (
                        <span style={{ fontSize: 11, color: "#f97316" }}>
                          Express
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
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

function PickupCard(props: {
  order: Order;
  saving: boolean;
  onPickupConfirm: (id: string) => void;
}) {
  const { order, saving, onPickupConfirm } = props;
  const [open, setOpen] = useState(false);

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
            {order.pickup_slot}
            {order.express_delivery && (
              <span style={{ color: "#f97316", marginLeft: 4 }}>
                • Express
              </span>
            )}
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

      <button
        type="button"
        disabled={saving}
        onClick={() => onPickupConfirm(order.id)}
        style={{
          marginTop: 10,
          width: "100%",
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
  );
}

/* ---------- ORDERS VIEW ---------- */

function OrdersView(props: {
  isMobile: boolean;
  loading: boolean;
  sortedOrders: Order[];
  savingBulk: boolean;
  savingMap: Record<string, boolean>;
  onMarkAllNewAsPicked: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onWorkerChange: (id: string, worker: string | null) => void;
  onTotalUpdate: (id: string, total: number | null) => void;
}) {
  const {
    isMobile,
    loading,
    sortedOrders,
    savingBulk,
    savingMap,
    onMarkAllNewAsPicked,
    onStatusChange,
    onWorkerChange,
    onTotalUpdate,
  } = props;

  // Local billing state: base amount + discount %
  const [billingState, setBillingState] = useState<
    Record<string, { base: string; discount: number }>
  >({});

  // Item quantities per order
  const [itemState, setItemState] = useState<
    Record<string, Record<string, string>>
  >({});

  const getItemTotal = (
    id: string,
    state: Record<string, Record<string, string>>
  ): number => {
    const items = state[id];
    if (!items) return 0;
    let sum = 0;
    for (const key of Object.keys(items)) {
      const qtyStr = items[key];
      if (!qtyStr) continue;
      const qty = parseInt(qtyStr, 10);
      if (!qty || qty <= 0) continue;
      const def = ITEM_PRICES[key];
      if (!def) continue;
      sum += qty * def.price;
    }
    return sum;
  };

  const buildItemsSummary = (id: string): string => {
    const items = itemState[id];
    if (!items) return "";
    const lines: string[] = [];
    for (const key of Object.keys(items)) {
      const qtyStr = items[key];
      if (!qtyStr) continue;
      const qty = parseInt(qtyStr, 10);
      if (!qty || qty <= 0) continue;
      const def = ITEM_PRICES[key];
      if (!def) continue;
      const lineTotal = qty * def.price;
      lines.push(
        `${def.label}: ${qty} × ₹${def.price} = ₹${lineTotal}`
      );
    }
    return lines.join("\n");
  };

  const handleBaseChange = (id: string, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    setBillingState((prev) => {
      const existing = prev[id] || { base: "", discount: 0 };
      return {
        ...prev,
        [id]: { ...existing, base: cleaned },
      };
    });
  };

  const handleDiscountChange = (
    id: string,
    discount: number,
    order: Order
  ) => {
    setBillingState((prev) => {
      const existing = prev[id] || { base: "", discount: 0 };
      return {
        ...prev,
        [id]: { ...existing, discount },
      };
    });

    const total = computeFinalTotal(
      id,
      order,
      billingState,
      itemState,
      discount
    );
    if (total !== null) {
      void onTotalUpdate(id, total);
    }
  };

  const handleBaseBlur = (id: string, order: Order) => {
    const total = computeFinalTotal(id, order, billingState, itemState);
    if (total !== null) {
      void onTotalUpdate(id, total);
    }
  };

  const handleItemQtyChange = (
    id: string,
    order: Order,
    itemKey: string,
    raw: string
  ) => {
    const cleaned = raw.replace(/\D/g, "");
    const nextState: Record<string, Record<string, string>> = {
      ...itemState,
      [id]: {
        ...(itemState[id] || {}),
        [itemKey]: cleaned,
      },
    };
    setItemState(nextState);

    const total = computeFinalTotal(id, order, billingState, nextState);
    if (total !== null) {
      void onTotalUpdate(id, total);
    }
  };

  const computeFinalTotal = (
    id: string,
    order: Order,
    state: Record<string, { base: string; discount: number }>,
    itemsState: Record<string, Record<string, string>>,
    overrideDiscount?: number
  ): number | null => {
    const entry = state[id] || { base: "", discount: 0 };
    const baseStr = entry.base;
    const discount = overrideDiscount ?? entry.discount ?? 0;

    const itemTotal = getItemTotal(id, itemsState);

    let baseNum = 0;
    if (itemTotal > 0) {
      baseNum = itemTotal;
    } else if (baseStr) {
      const parsed = parseInt(baseStr, 10);
      if (Number.isNaN(parsed) || parsed <= 0) return null;
      baseNum = parsed;
    } else {
      return null;
    }

    const pickupCharge =
      !order.self_drop && baseNum > 0 && baseNum < 200 ? 15 : 0;
    const expressCharge = order.express_delivery ? 25 : 0;

    const subtotal = baseNum + pickupCharge + expressCharge;
    const final = Math.round(subtotal * (1 - discount / 100));
    return final;
  };

  if (loading) {
    return (
      <div style={{ fontSize: 13, color: "#9ca3af" }}>Loading orders…</div>
    );
  }

  if (sortedOrders.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "#9ca3af" }}>
        No orders for this date (and society) yet.
      </div>
    );
  }

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
          disabled={savingBulk || sortedOrders.length === 0}
          style={{
            borderRadius: 999,
            border: "none",
            padding: "6px 12px",
            fontSize: 11,
            fontWeight: 600,
            cursor:
              savingBulk || sortedOrders.length === 0
                ? "not-allowed"
                : "pointer",
            background:
              "linear-gradient(to right, #f97316, #ea580c, #7c2d12)",
            color: "#fffbeb",
            opacity: savingBulk || sortedOrders.length === 0 ? 0.6 : 1,
          }}
        >
          {savingBulk ? "Marking NEW as PICKED…" : "Mark all NEW as PICKED"}
        </button>
        <span style={{ fontSize: 11, color: "#9ca3af" }}>
          Express orders are always at the top; within each group we follow FIFO
          (oldest first).
        </span>
      </div>

      {isMobile ? (
        <div style={{ display: "grid", gap: 8 }}>
          {sortedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              saving={savingMap[order.id] ?? false}
              billingState={billingState}
              onBaseChange={handleBaseChange}
              onBaseBlur={handleBaseBlur}
              onDiscountChange={handleDiscountChange}
              onStatusChange={onStatusChange}
              onWorkerChange={onWorkerChange}
              itemItems={itemState[order.id]}
              onItemQtyChange={handleItemQtyChange}
            />
          ))}
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
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 900,
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
                  <th style={thStyle}>Billing</th>
                </tr>
              </thead>
              <tbody>
                {sortedOrders.map((order, index) => {
                  const saving = savingMap[order.id] ?? false;
                  const entry = billingState[order.id] || {
                    base: "",
                    discount: 0,
                  };
                  const baseStr = entry.base;
                  const discount = entry.discount ?? 0;

                  const itemTotal = getItemTotal(order.id, itemState);

                  let baseNum = 0;
                  if (itemTotal > 0) {
                    baseNum = itemTotal;
                  } else if (baseStr.trim() !== "") {
                    const parsed = parseInt(baseStr, 10);
                    baseNum = Number.isNaN(parsed) ? 0 : parsed;
                  }

                  const pickupCharge =
                    !order.self_drop && baseNum > 0 && baseNum < 200
                      ? 15
                      : 0;
                  const expressCharge = order.express_delivery ? 25 : 0;
                  const subtotal = baseNum + pickupCharge + expressCharge;
                  const finalCalculated =
                    baseNum === 0
                      ? null
                      : Math.round(subtotal * (1 - discount / 100));

                  const effectiveTotal =
                    finalCalculated !== null
                      ? finalCalculated
                      : order.total_price ?? null;

                  const canWhatsApp =
                    !!order.phone &&
                    effectiveTotal !== null &&
                    (order.status === "READY" || order.status === "DELIVERED");

                  const itemsSummary = buildItemsSummary(order.id);

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
                          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            onStatusChange(
                              order.id,
                              e.target.value as OrderStatus
                            )
                          }
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
                          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            onWorkerChange(
                              order.id,
                              e.target.value || null
                            )
                          }
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
                        <div
                          style={{
                            display: "grid",
                            gap: 4,
                            fontSize: 11,
                          }}
                        >
                          <ItemCalculator
                            order={order}
                            items={itemState[order.id]}
                            onQtyChange={handleItemQtyChange}
                          />

                          <div>
                            <span>Base amount: </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={baseStr}
                              onChange={(e) =>
                                handleBaseChange(order.id, e.target.value)
                              }
                              onBlur={() =>
                                handleBaseBlur(order.id, order)
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
                            {itemTotal > 0 && (
                              <div
                                style={{
                                  marginTop: 2,
                                  fontSize: 10,
                                  color: "#9ca3af",
                                }}
                              >
                                Items total: ₹{itemTotal} (auto)
                              </div>
                            )}
                          </div>
                          <div>
                            <span>Discount: </span>
                            <select
                              value={discount}
                              onChange={(e) =>
                                handleDiscountChange(
                                  order.id,
                                  Number(e.target.value),
                                  order
                                )
                              }
                              style={{
                                marginTop: 2,
                                width: "100%",
                                borderRadius: 6,
                                border: "1px solid #374151",
                                backgroundColor: "#020617",
                                color: "#e5e7eb",
                                fontSize: 11,
                                padding: "2px 6px",
                              }}
                            >
                              {DISCOUNT_OPTIONS.map((d) => (
                                <option key={d} value={d}>
                                  {d === 0 ? "No discount" : `${d}%`}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ color: "#9ca3af" }}>
                            <div>
                              Pickup: ₹{pickupCharge} · Express: ₹
                              {expressCharge}
                            </div>
                            <div>
                              Final total:{" "}
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: "#22c55e",
                                }}
                              >
                                {effectiveTotal !== null
                                  ? `₹${effectiveTotal}`
                                  : "—"}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!canWhatsApp}
                            onClick={() => {
                              if (!effectiveTotal) return;
                              openWhatsApp(
                                order,
                                effectiveTotal,
                                discount,
                                itemsSummary || undefined
                              );
                            }}
                            style={{
                              marginTop: 4,
                              borderRadius: 999,
                              border: "none",
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: canWhatsApp ? "pointer" : "not-allowed",
                              background:
                                "linear-gradient(to right, #22c55e, #16a34a)",
                              color: "#022c22",
                              opacity: canWhatsApp ? 1 : 0.4,
                            }}
                          >
                            WhatsApp customer
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
      )}
    </>
  );
}

/* ---------- ITEM CALCULATOR (shared) ---------- */

function ItemCalculator(props: {
  order: Order;
  items: Record<string, string> | undefined;
  onQtyChange: (
    orderId: string,
    order: Order,
    itemKey: string,
    raw: string
  ) => void;
}) {
  const { order, items, onQtyChange } = props;
  const [open, setOpen] = useState(false);
  const currentItems = items || {};

  let total = 0;
  for (const key of Object.keys(ITEM_PRICES)) {
    const qtyStr = currentItems[key];
    if (!qtyStr) continue;
    const qty = parseInt(qtyStr, 10);
    if (!qty || qty <= 0) continue;
    total += qty * ITEM_PRICES[key].price;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        style={{
          width: "100%",
          borderRadius: 999,
          border: "1px solid #374151",
          padding: "4px 8px",
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: "#020617",
          color: "#e5e7eb",
          cursor: "pointer",
        }}
      >
        {open ? "Hide items" : "Add items"}{" "}
        {total > 0 ? ` (₹${total})` : ""}
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            paddingTop: 6,
            borderTop: "1px dashed #1f2937",
            display: "grid",
            gap: 4,
            fontSize: 11,
          }}
        >
          {Object.entries(ITEM_PRICES).map(([key, def]) => {
            const qty = currentItems[key] || "";
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div>
                  <div>{def.label}</div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#9ca3af",
                    }}
                  >
                    ₹{def.price} per piece
                  </div>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={qty}
                  onChange={(e) =>
                    onQtyChange(order.id, order, key, e.target.value)
                  }
                  placeholder="0"
                  style={{
                    width: 56,
                    borderRadius: 6,
                    border: "1px solid #374151",
                    backgroundColor: "#020617",
                    color: "#e5e7eb",
                    fontSize: 11,
                    padding: "4px 6px",
                    textAlign: "right",
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- MOBILE ORDER CARD ---------- */

function OrderCard(props: {
  order: Order;
  saving: boolean;
  billingState: Record<string, { base: string; discount: number }>;
  onBaseChange: (id: string, raw: string) => void;
  onBaseBlur: (id: string, order: Order) => void;
  onDiscountChange: (id: string, discount: number, order: Order) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onWorkerChange: (id: string, worker: string | null) => void;
  itemItems?: Record<string, string>;
  onItemQtyChange: (
    orderId: string,
    order: Order,
    itemKey: string,
    raw: string
  ) => void;
}) {
  const {
    order,
    saving,
    billingState,
    onBaseChange,
    onBaseBlur,
    onDiscountChange,
    onStatusChange,
    onWorkerChange,
    itemItems,
    onItemQtyChange,
  } = props;

  const entry = billingState[order.id] || { base: "", discount: 0 };
  const baseStr = entry.base;
  const discount = entry.discount ?? 0;

  const itemsForOrder = itemItems || {};
  let itemTotal = 0;
  for (const key of Object.keys(ITEM_PRICES)) {
    const qtyStr = itemsForOrder[key];
    if (!qtyStr) continue;
    const qty = parseInt(qtyStr, 10);
    if (!qty || qty <= 0) continue;
    itemTotal += qty * ITEM_PRICES[key].price;
  }

  let baseNum = 0;
  if (itemTotal > 0) {
    baseNum = itemTotal;
  } else if (baseStr.trim() !== "") {
    const parsed = parseInt(baseStr, 10);
    baseNum = Number.isNaN(parsed) ? 0 : parsed;
  }

  const pickupCharge =
    !order.self_drop && baseNum > 0 && baseNum < 200 ? 15 : 0;
  const expressCharge = order.express_delivery ? 25 : 0;
  const subtotal = baseNum + pickupCharge + expressCharge;
  const finalCalculated =
    baseNum === 0 ? null : Math.round(subtotal * (1 - discount / 100));

  const effectiveTotal =
    finalCalculated !== null ? finalCalculated : order.total_price ?? null;

  const canWhatsApp =
    !!order.phone &&
    effectiveTotal !== null &&
    (order.status === "READY" || order.status === "DELIVERED");

  const buildItemsSummary = (): string => {
    const lines: string[] = [];
    for (const key of Object.keys(itemsForOrder)) {
      const qtyStr = itemsForOrder[key];
      if (!qtyStr) continue;
      const qty = parseInt(qtyStr, 10);
      if (!qty || qty <= 0) continue;
      const def = ITEM_PRICES[key];
      if (!def) continue;
      const lineTotal = qty * def.price;
      lines.push(
        `${def.label}: ${qty} × ₹${def.price} = ₹${lineTotal}`
      );
    }
    return lines.join("\n");
  };

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
      {/* Top row: customer & basic info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {order.customer_name}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            {order.society_name} • Flat: {order.flat_number}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
            {order.pickup_slot}
            {order.express_delivery && (
              <span style={{ color: "#f97316", marginLeft: 4 }}>
                • Express
              </span>
            )}
            {order.self_drop && (
              <span style={{ color: "#22c55e", marginLeft: 4 }}>
                • Self drop
              </span>
            )}
          </div>
          {order.notes && (
            <div
              style={{
                fontSize: 11,
                color: "#e5e7eb",
                marginTop: 4,
              }}
            >
              Notes: {order.notes}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <StatusBadge status={order.status} />
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
            {order.phone}
          </div>
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
        </div>
      </div>

      {/* Status + worker controls */}
      <div
        style={{
          marginTop: 8,
          paddingTop: 6,
          borderTop: "1px dashed #1f2937",
          display: "grid",
          gap: 6,
          fontSize: 11,
        }}
      >
        <div>
          <div style={{ marginBottom: 2 }}>Status</div>
          <select
            value={order.status}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onStatusChange(order.id, e.target.value as OrderStatus)
            }
            style={{
              width: "100%",
              borderRadius: 6,
              border: "1px solid #374151",
              backgroundColor: "#020617",
              color: "#e5e7eb",
              fontSize: 12,
              padding: "4px 6px",
            }}
          >
            <option value="NEW">NEW</option>
            <option value="PICKED">PICKED</option>
            <option value="READY">READY</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
        </div>
        <div>
          <div style={{ marginBottom: 2 }}>Worker</div>
          <select
            value={order.worker_name || ""}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onWorkerChange(order.id, e.target.value || null)
            }
            style={{
              width: "100%",
              borderRadius: 6,
              border: "1px solid #374151",
              backgroundColor: "#020617",
              color: "#e5e7eb",
              fontSize: 12,
              padding: "4px 6px",
            }}
          >
            <option value="">Unassigned</option>
            {WORKERS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Billing block */}
      <div
        style={{
          marginTop: 8,
          paddingTop: 6,
          borderTop: "1px dashed #1f2937",
          display: "grid",
          gap: 6,
          fontSize: 11,
        }}
      >
        <ItemCalculator
          order={order}
          items={itemsForOrder}
          onQtyChange={onItemQtyChange}
        />

        <div>
          <div style={{ marginBottom: 2 }}>Base amount</div>
          <input
            type="text"
            inputMode="numeric"
            value={baseStr}
            onChange={(e) => onBaseChange(order.id, e.target.value)}
            onBlur={() => onBaseBlur(order.id, order)}
            placeholder="₹"
            style={{
              width: "100%",
              borderRadius: 6,
              border: "1px solid #374151",
              backgroundColor: "#020617",
              color: "#e5e7eb",
              fontSize: 12,
              padding: "4px 6px",
            }}
          />
          {itemTotal > 0 && (
            <div
              style={{
                marginTop: 2,
                fontSize: 10,
                color: "#9ca3af",
              }}
            >
              Items total: ₹{itemTotal} (auto)
            </div>
          )}
        </div>
        <div>
          <div style={{ marginBottom: 2 }}>Discount</div>
          <select
            value={discount}
            onChange={(e) =>
              onDiscountChange(order.id, Number(e.target.value), order)
            }
            style={{
              width: "100%",
              borderRadius: 6,
              border: "1px solid #374151",
              backgroundColor: "#020617",
              color: "#e5e7eb",
              fontSize: 12,
              padding: "4px 6px",
            }}
          >
            {DISCOUNT_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d === 0 ? "No discount" : `${d}%`}
              </option>
            ))}
          </select>
        </div>
        <div style={{ color: "#9ca3af" }}>
          <div>
            Pickup: ₹{pickupCharge} · Express: ₹{expressCharge}
          </div>
          <div>
            Final total:{" "}
            <span
              style={{
                fontWeight: 700,
                color: "#22c55e",
              }}
            >
              {effectiveTotal !== null ? `₹${effectiveTotal}` : "—"}
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={!canWhatsApp}
          onClick={() => {
            if (!effectiveTotal) return;
            const summary = buildItemsSummary();
            openWhatsApp(
              order,
              effectiveTotal,
              discount,
              summary || undefined
            );
          }}
          style={{
            marginTop: 4,
            width: "100%",
            borderRadius: 999,
            border: "none",
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            cursor: canWhatsApp ? "pointer" : "not-allowed",
            background: "linear-gradient(to right, #22c55e, #16a34a)",
            color: "#022c22",
            opacity: canWhatsApp ? 1 : 0.4,
          }}
        >
          WhatsApp customer
        </button>
      </div>
    </div>
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

function normalisePhoneForWhatsApp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) {
    // assume Indian mobile without country code
    return `91${digits}`;
  }
  // if already starts with 91 and long enough, use as-is
  if (digits.startsWith("91") && digits.length >= 12) {
    return digits;
  }
  return digits;
}

function openWhatsApp(
  order: Order,
  total: number,
  discountPercent: number,
  itemsText?: string
) {
  if (typeof window === "undefined") return;
  const phone = normalisePhoneForWhatsApp(order.phone);
  if (!phone) return;

  const isReady = order.status === "READY";
  const isDelivered = order.status === "DELIVERED";

  let statusLine: string;
  if (isReady) {
    if (order.self_drop) {
      // Customer dropped clothes at shop
      statusLine =
        "Your ironing order is READY for pickup at the shop.";
    } else {
      // We picked up from customer
      statusLine =
        "Your ironing order is READY. We will deliver it to your flat shortly.";
    }
  } else if (isDelivered) {
    statusLine =
      "Your ironing order has been DELIVERED. Hope you are happy with the service.";
  } else {
    statusLine = "Your ironing order update.";
  }

  const discountLine =
    discountPercent && discountPercent > 0
      ? `Discount applied: ${discountPercent}%.\n`
      : "";

  // Build UPI deep link (works with GPay, PhonePe, Paytm, BHIM, etc)
  const upiLink = `upi://pay?pa=shukla354@okicici&pn=${encodeURIComponent(
    "Iron Shop"
  )}&am=${encodeURIComponent(String(total))}&cu=INR&tn=${encodeURIComponent(
    `Iron order – ${order.society_name} ${order.flat_number}`
  )}`;

  const paymentLine = `Total amount: ₹${total}.\nYou can pay via UPI to shukla354@okicici.\nPay easily using any UPI app (GPay, PhonePe, Paytm, BHIM etc.):\n${upiLink}`;

  const itemsSection =
    itemsText && itemsText.trim().length > 0
      ? `\nItems:\n${itemsText}\n`
      : "";

  const thanksLine = "Thank you for choosing us!";

  const text = `Hi ${order.customer_name || ""},\n${statusLine}\n${discountLine}${paymentLine}${itemsSection}\nFlat: ${order.flat_number}, ${order.society_name}\n${thanksLine}`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
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
