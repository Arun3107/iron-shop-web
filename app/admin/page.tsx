// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";

import type { Order, AdminTab } from "./types";
import { filterLabelStyle, filterInputStyle } from "./styles";
import PickupView from "./components/PickupView";
import SimpleView from "./components/SimpleView";
import OrdersView from "./components/OrdersView";
import WalkInView from "./components/WalkInView";

export default function AdminPage() {
  const [date, setDate] = useState<string>("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [societyFilter, setSocietyFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<AdminTab>("ORDERS");
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);

  // Walk-in order state
    const [newCustomerName, setNewCustomerName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSociety, setNewSociety] = useState("");
  const [creatingWalkIn, setCreatingWalkIn] = useState(false);


  // Set default date = today (used for walk-in orders)
  useEffect(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    setDate(todayISO);
  }, []);

  // Detect mobile width
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Load all orders once on mount
  useEffect(() => {
    void fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError("");

    try {
      // Always send date=ALL so backend doesn't complain
      const res = await fetch(`/api/admin/orders?date=ALL`);
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
      status?: Order["status"];
      worker_name?: string | null;
      total_price?: number | null;
      base_amount?: number | null;
      items_json?: Record<string, number> | null;
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
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      console.error("Update order request error:", err);
      setError("Unexpected error while updating order");
    } finally {
      setRowSaving(id, false);
    }
  }

  function handleStatusChange(id: string, status: Order["status"]) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    void saveOrderPartial(id, { status });
  }

  function handleTotalUpdate(
  id: string,
  total: number | null,
  baseAmount: number | null,
  itemsCounts: Record<string, number> | null
) {
  // If there are no items, send an empty object instead of null
  // so the backend actually clears old items_json.
  const sanitizedItems =
    itemsCounts && Object.keys(itemsCounts).length > 0
      ? itemsCounts
      : {};

  const patch: {
    total_price?: number | null;
    base_amount?: number | null;
    items_json?: Record<string, number>; // always send an object
  } = {
    total_price: total,
    base_amount: baseAmount,
    items_json: sanitizedItems,
  };

  void saveOrderPartial(id, patch);
}


  async function handlePickupConfirm(id: string) {
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
          express_delivery: false, // walk-ins are never express
          self_drop: true,
          status: "PICKED", // walk-in orders start as PICKED
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
    } catch (err) {
      console.error("Create order request error:", err);
      setError("Unexpected error while creating walk-in order");
    } finally {
      setCreatingWalkIn(false);
    }
  }


  const societies = Array.from(new Set(orders.map((o) => o.society_name))).sort();

  const filteredOrders =
    societyFilter === "ALL"
      ? orders
      : orders.filter((o) => o.society_name === societyFilter);

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.express_delivery !== b.express_delivery) {
      return a.express_delivery ? -1 : 1;
    }
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return aTime - bTime;
  });

  // Orders tab: only show orders that are already picked up (status === "PICKED")
  // Includes walk-ins because they are also status "PICKED".
  const pickedOrders = sortedOrders.filter((o) => o.status === "PICKED");

  const walkInOrders = sortedOrders.filter((o) => o.self_drop);

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
          View bookings, plan pickups, create walk-in orders, update status, and
          track revenue – optimised for mobile use by your team.
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
          {(
            ["ORDERS", "WALKIN", "PICKUP", "READY"] as AdminTab[]
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                border: "none",
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor:
                  activeTab === tab ? "#111827" : "transparent",
                color: activeTab === tab ? "#e5e7eb" : "#9ca3af",
              }}
            >
              {tab === "ORDERS"
                ? "Orders"
                : tab === "WALKIN"
                ? "Walk-in"
                : tab === "PICKUP"
                ? "Pickup"
                : "Ready to deliver"}
            </button>
          ))}
        </div>

        {/* Filters */}
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

        {activeTab === "PICKUP" ? (
          <PickupView
            isMobile={isMobile}
            loading={loading}
            pickupOrders={pickupOrders}
            savingMap={savingMap}
            onPickupConfirm={handlePickupConfirm}
          />
        ) : activeTab === "ORDERS" ? (
  <OrdersView
    isMobile={isMobile}
    loading={loading}
    // Only picked orders (NEW/READY/DELIVERED are hidden here)
    sortedOrders={pickedOrders}
    savingMap={savingMap}
    onStatusChange={handleStatusChange}
    onTotalUpdate={handleTotalUpdate}
  />
        ) : activeTab === "WALKIN" ? (
          <WalkInView
            isMobile={isMobile}
            societies={societies}
            newCustomerName={newCustomerName}
            newPhone={newPhone}
            newSociety={newSociety}
            creatingWalkIn={creatingWalkIn}
            setNewCustomerName={setNewCustomerName}
            setNewPhone={setNewPhone}
            setNewSociety={setNewSociety}
            onCreateWalkIn={handleCreateWalkInOrder}
          />

        ) : (
          <SimpleView
            isMobile={isMobile}
            loading={loading}
            sortedOrders={sortedOrders}
            onMarkDelivered={(id) => handleStatusChange(id, "DELIVERED")}
          />
        )}
      </div>
    </main>
  );
}
