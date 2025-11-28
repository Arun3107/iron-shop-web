"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type CSSProperties,
} from "react";

const SOCIETIES = [
  "PSR Aster",
  "Sowparnika Chandrakantha",
  "Tulasi Premier",
  "Other (not listed)",
];

const PICKUP_SLOT = "9:00 AM – 11:00 AM";

const PRICE_ITEMS = [
  { id: "basic", label: "Shirt / Trousers / T-Shirt / Jeans", price: 10 },
  { id: "kurti", label: "Kurti / Kurta / Pajama", price: 10 },
  { id: "bedsheetSingle", label: "Bedsheet (Single)", price: 30 },
  { id: "bedsheetDouble", label: "Bedsheet (Double)", price: 45 },
  { id: "sareeSimple", label: "Saree (Simple)", price: 45 },
  { id: "sareeHeavy", label: "Saree (Heavy / Silk)", price: 60 },
  { id: "lehenga", label: "Lehenga / Designer Dress", price: 60 },
  { id: "coat", label: "Coat / Blazer", price: 50 },
];

type View = "home" | "book" | "orders";

export default function Home() {
  const [view, setView] = useState<View>("home");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "24px 16px",
        background:
          "linear-gradient(135deg, #fef3c7 0%, #e5e7eb 35%, #f9fafb 100%)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: "rgba(255,255,255,0.96)",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 16px 40px rgba(0,0,0,0.14)",
          backdropFilter: "blur(6px)",
        }}
      >
        {view === "home" && (
          <HomeScreen
            onBookClick={() => setView("book")}
            onOrdersClick={() => setView("orders")}
          />
        )}

        {view === "book" && <BookingForm onBack={() => setView("home")} />}

        {view === "orders" && <MyOrders onBack={() => setView("home")} />}
      </div>
    </main>
  );
}

/* ---------- HOME SCREEN ---------- */

function HomeScreen(props: {
  onBookClick: () => void;
  onOrdersClick: () => void;
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          borderRadius: 18,
          padding: 18,
          background:
            "radial-gradient(circle at top left, #fed7aa 0%, #f97316 35%, #7c2d12 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "18px solid rgba(255,255,255,0.18)",
          }}
        />
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 0.2,
            marginBottom: 6,
          }}
        >
          Iron Shop – PSR Aster
        </h1>
        <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 10 }}>
          Professional steam ironing for your daily wear, bedsheets, and party
          outfits – with free pickup & delivery on orders above ₹200.
        </p>
        <div style={{ fontSize: 12, opacity: 0.95, lineHeight: 1.5 }}>
          <div>
            📍{" "}
            <strong>
              PSR Aster, Chambenahally, Sarjapura Road, Bengaluru – 562125
            </strong>
          </div>
          <div>
            📞 Contact:{" "}
            <a
              href="tel:+919902717676"
              style={{ color: "white", fontWeight: 600, textDecoration: "none" }}
            >
              +91 9902717676
            </a>
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          padding: 14,
          backgroundColor: "#f9fafb",
          fontSize: 12,
          color: "#4b5563",
        }}
      >
        <p style={{ marginBottom: 4 }}>
          ✅ Same-day pickup slot: <strong>9:00 AM – 11:00 AM</strong>
        </p>
        <p style={{ marginBottom: 4 }}>
          ✅ Express delivery (within 4 hours): <strong>+₹25</strong>
        </p>
        <p style={{ marginBottom: 0 }}>
          ✅ You can choose{" "}
          <strong>doorstep pickup & delivery</strong> or{" "}
          <strong>self drop & pickup from shop</strong>. For doorstep, orders
          below ₹200 have a <strong>₹15 delivery charge</strong> · orders
          ₹200+ get <strong>free pickup & delivery</strong>.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 4,
        }}
      >
        <button
          type="button"
          onClick={props.onBookClick}
          style={{
            borderRadius: 999,
            padding: "10px 12px",
            border: "none",
            background:
              "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #7c2d12 100%)",
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Book New
        </button>
        <button
          type="button"
          onClick={props.onOrdersClick}
          style={{
            borderRadius: 999,
            padding: "10px 12px",
            border: "1px solid #d1d5db",
            backgroundColor: "white",
            color: "#111827",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          My Orders
        </button>
      </div>
    </div>
  );
}

/* ---------- BOOKING FORM ---------- */

function BookingForm(props: { onBack: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [society, setSociety] = useState("PSR Aster");
  const [otherSociety, setOtherSociety] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [expressDelivery, setExpressDelivery] = useState(false);
  const [selfDrop, setSelfDrop] = useState(false); // NEW
  const [message, setMessage] = useState("");

  const [useEstimator, setUseEstimator] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Load saved details from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem("ironingUserInfo");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.society) setSociety(parsed.society);
        if (parsed.otherSociety) setOtherSociety(parsed.otherSociety || "");
        if (parsed.flatNumber) setFlatNumber(parsed.flatNumber);
      } catch (e) {
        console.warn("Failed to parse saved user info", e);
      }
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setPickupDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  const saveUserInfo = () => {
    if (typeof window === "undefined") return;
    const payload = {
      customerName,
      phone,
      society,
      otherSociety,
      flatNumber,
    };
    window.localStorage.setItem("ironingUserInfo", JSON.stringify(payload));
  };

  const handleLoadProfile = async () => {
    if (!phone.trim()) {
      setMessage("Enter your mobile number first to load saved details.");
      return;
    }

    setLoadingProfile(true);
    setMessage("");
    try {
      const res = await fetch(
        `/api/customer?phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Could not load saved details.");
        return;
      }

      const c = data.customer;
      if (!c) {
        setMessage("No saved details found for this number.");
        return;
      }

      if (c.customer_name) setCustomerName(c.customer_name);
      if (c.society_name) setSociety(c.society_name);
      if (c.flat_number) setFlatNumber(c.flat_number);
      setMessage("Saved details loaded for this number.");
    } catch (err) {
      console.error("Load profile error:", err);
      setMessage("Could not load saved details.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!customerName || !phone || !flatNumber || !pickupDate) {
      setMessage("Please fill name, mobile, flat number and pickup date.");
      return;
    }

    const finalSociety =
      society === "Other (not listed)" ? otherSociety.trim() : society;
    if (!finalSociety) {
      setMessage("Please select or enter your society / apartment name.");
      return;
    }

    const itemsTotal = PRICE_ITEMS.reduce(
      (sum, item) => sum + (quantities[item.id] || 0) * item.price,
      0
    );
    const expressAmount = expressDelivery ? 25 : 0;
    const deliveryCharge =
      !selfDrop && itemsTotal > 0 && itemsTotal < 200 ? 15 : 0;
    const estimatedTotal = itemsTotal + expressAmount + deliveryCharge;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          phone: phone.trim(),
          society_name: finalSociety,
          flat_number: flatNumber.trim(),
          pickup_date: pickupDate,
          pickup_slot: PICKUP_SLOT,
          express_delivery: expressDelivery,
          self_drop: selfDrop,
          notes: itemsText.trim() || null,
          items_estimated_total: itemsTotal || null,
          delivery_charge: deliveryCharge || null,
          express_charge: expressAmount || null,
          estimated_total: estimatedTotal || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Order save error:", data);
        setMessage(data.error || "Failed to place order. Please try again.");
        return;
      }

      saveUserInfo();
      setMessage(
        `Thank you! Your pickup is booked for ${pickupDate} between ${PICKUP_SLOT}.`
      );
      setItemsText("");
      setExpressDelivery(false);
      setUseEstimator(false);
      setQuantities({});
    } catch (err) {
      console.error("Request error:", err);
      setMessage("Something went wrong. Please try again.");
    }
  };

  const handleQtyChange = (id: string, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    const num = cleaned === "" ? 0 : parseInt(cleaned, 10);
    setQuantities((prev) => ({
      ...prev,
      [id]: Number.isNaN(num) ? 0 : num,
    }));
  };

  const itemsTotal = PRICE_ITEMS.reduce(
    (sum, item) => sum + (quantities[item.id] || 0) * item.price,
    0
  );
  const expressAmount = expressDelivery ? 25 : 0;
  const deliveryCharge =
    !selfDrop && itemsTotal > 0 && itemsTotal < 200 ? 15 : 0;
  const estimatedTotal = itemsTotal + expressAmount + deliveryCharge;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Back + title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <button
          type="button"
          onClick={props.onBack}
          style={{
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            backgroundColor: "white",
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          ← Home
        </button>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#111827",
            margin: 0,
          }}
        >
          Book a Pickup
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Mobile Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={handleLoadProfile}
            style={{
              marginTop: 6,
              fontSize: 11,
              border: "none",
              background: "none",
              color: "#2563eb",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {loadingProfile
              ? "Loading saved details..."
              : "Load saved details for this number"}
          </button>
        </div>

        <div>
          <label style={labelStyle}>Society / Apartment</label>
          <select
            value={society}
            onChange={(e) => setSociety(e.target.value)}
            style={inputStyle}
          >
            {SOCIETIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {society === "Other (not listed)" && (
            <input
              type="text"
              placeholder="Enter your society name"
              value={otherSociety}
              onChange={(e) => setOtherSociety(e.target.value)}
              style={{ ...inputStyle, marginTop: 8 }}
            />
          )}
        </div>

        <div>
          <label style={labelStyle}>Flat / House Number</label>
          <input
            type="text"
            value={flatNumber}
            onChange={(e) => setFlatNumber(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div>
            <label style={labelStyle}>Pickup Date</label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Pickup Time</label>
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {PICKUP_SLOT}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              (Fixed slot every day)
            </div>
          </div>
        </div>

        {/* NEW: pickup method */}
        <div>
          <label style={labelStyle}>Pickup / Drop method</label>
          <div
            style={{
              display: "grid",
              gap: 6,
              fontSize: 13,
              color: "#111827",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="radio"
                name="pickupMethod"
                checked={!selfDrop}
                onChange={() => setSelfDrop(false)}
              />
              <span>Doorstep pickup & delivery</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <input
                type="radio"
                name="pickupMethod"
                checked={selfDrop}
                onChange={() => setSelfDrop(true)}
              />
              <span>
                I&apos;ll drop & pickup from shop{" "}
                <span style={{ color: "#16a34a", fontWeight: 600 }}>
                  (no delivery charges)
                </span>
              </span>
            </label>
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={expressDelivery}
            onChange={(e) => setExpressDelivery(e.target.checked)}
          />
          <span style={{ fontSize: 13, color: "#111827" }}>
            Express Delivery (within 4 hours) +₹25
          </span>
        </label>

        {/* Optional estimator toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={useEstimator}
            onChange={(e) => setUseEstimator(e.target.checked)}
          />
          <span style={{ fontSize: 13, color: "#111827" }}>
            Add items and see estimated total (optional)
          </span>
        </label>

        {/* Estimator section */}
        {useEstimator && (
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 12,
              backgroundColor: "#f9fafb",
              marginTop: 4,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#111827",
                marginBottom: 8,
              }}
            >
              Select items (optional)
            </p>
            <div
              style={{
                display: "grid",
                gap: 8,
                fontSize: 12,
                color: "#111827",
              }}
            >
              {PRICE_ITEMS.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      ₹{item.price} per piece
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={quantities[item.id] ?? 0}
                    onChange={(e) =>
                      handleQtyChange(item.id, e.target.value)
                    }
                    style={{
                      width: 70,
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      padding: "4px 8px",
                      fontSize: 13,
                      color: "#111827",
                      backgroundColor: "white",
                    }}
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 10,
                paddingTop: 8,
                borderTop: "1px dashed #e5e7eb",
                fontSize: 12,
                color: "#111827",
              }}
            >
              <div>
                Items total:{" "}
                <span style={{ fontWeight: 600 }}>₹{itemsTotal}</span>
              </div>
              {expressDelivery && <div>+ Express delivery: ₹25</div>}
              {!selfDrop && deliveryCharge > 0 && (
                <div>
                  + Delivery charge (doorstep order below ₹200): ₹15
                </div>
              )}
              <div style={{ marginTop: 4 }}>
                Estimated total:{" "}
                <span
                  style={{
                    fontWeight: 700,
                    color: "#065f46",
                  }}
                >
                  ₹{estimatedTotal}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginTop: 4,
                }}
              >
                Final amount may vary slightly based on actual items.
              </div>
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Other items / notes (optional)</label>
          <textarea
            rows={3}
            placeholder="Example: delicate clothes, please return on hangers…"
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <button
          type="submit"
          style={{
            marginTop: 4,
            width: "100%",
            borderRadius: 8,
            padding: "10px 14px",
            backgroundColor: "#d97706",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Book Pickup
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "#065f46",
            backgroundColor: "#ecfdf3",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            padding: "8px 10px",
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px solid #e5e7eb",
          fontSize: 11,
          color: "#4b5563",
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Important notes</p>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>Payment is always Cash on Delivery (COD).</li>
          <li>
            For doorstep pickup, orders below ₹200: ₹15 extra pickup &
            delivery charge.
          </li>
          <li>
            Orders ₹200 and above (doorstep): free pickup & delivery. Self
            drop & pickup from shop has no delivery charges.
          </li>
          <li>Express Delivery (within 4 hours): +₹25.</li>
        </ul>

        <p
          style={{
            fontWeight: 600,
            marginBottom: 4,
            marginTop: 10,
          }}
        >
          Rate card (summary)
        </p>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>Shirt / Trousers / T-Shirt / Jeans – ₹10</li>
          <li>Kurti / Kurta / Pajama – ₹10</li>
          <li>Bedsheet (Single) – ₹30 · (Double) – ₹45</li>
          <li>Saree (Simple) – ₹45 · (Heavy/Silk) – ₹60</li>
          <li>Lehenga / Designer Dress – ₹60</li>
          <li>Coat / Blazer – ₹50</li>
        </ul>
      </div>
    </div>
  );
}

/* ---------- MY ORDERS (real view) ---------- */

type OrderStatus = "NEW" | "PICKED" | "DELIVERED";

interface OrderSummary {
  id: string;
  created_at: string;
  pickup_date: string;
  pickup_slot: string;
  society_name: string;
  flat_number: string;
  status: OrderStatus;
  estimated_total: number | null;
  total_price: number | null;
  express_delivery: boolean;
  self_drop: boolean;
}

function MyOrders(props: { onBack: () => void }) {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("ironingUserInfo");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.phone) setPhone(parsed.phone);
      } catch {
        // ignore
      }
    }
  }, []);

  const fetchOrders = async () => {
    setError("");
    setHasSearched(true);

    if (!phone.trim()) {
      setError("Enter your mobile number.");
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/my-orders?phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load orders.");
        setOrders([]);
        return;
      }

      setOrders(data.orders || []);
    } catch (err) {
      console.error("Fetch my orders error:", err);
      setError("Unexpected error while loading your orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (status: OrderStatus) => {
    if (status === "NEW") return "Booked";
    if (status === "PICKED") return "Picked up / In progress";
    return "Delivered";
  };

  const statusColor = (status: OrderStatus) => {
    if (status === "NEW") return "#1d4ed8";
    if (status === "PICKED") return "#f97316";
    return "#16a34a";
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <button
          type="button"
          onClick={props.onBack}
          style={{
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            backgroundColor: "white",
            padding: "4px 8px",
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          ← Home
        </button>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#111827",
            margin: 0,
          }}
        >
          My Orders
        </h2>
      </div>

      <div
        style={{
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          padding: 14,
          backgroundColor: "#f9fafb",
          fontSize: 13,
          color: "#4b5563",
        }}
      >
        <p style={{ marginBottom: 8 }}>
          Enter your mobile number to see your recent ironing orders.
        </p>
        <label style={labelStyle}>Mobile Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={fetchOrders}
          style={{
            marginTop: 10,
            width: "100%",
            borderRadius: 8,
            padding: "8px 12px",
            backgroundColor: "#6b7280",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "View Orders"}
        </button>

        {error && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#b91c1c",
              backgroundColor: "#fee2e2",
              borderRadius: 8,
              padding: "6px 8px",
            }}
          >
            {error}
          </div>
        )}

        {!loading && hasSearched && !error && orders.length === 0 && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            No recent orders found for this number.
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gap: 8,
            }}
          >
            {orders.map((o) => (
              <div
                key={o.id}
                style={{
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  backgroundColor: "white",
                  padding: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Pickup: {o.pickup_date} · {o.pickup_slot}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: "2px 8px",
                      backgroundColor: statusColor(o.status),
                      color: "#f9fafb",
                    }}
                  >
                    {statusLabel(o.status)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#4b5563",
                    marginBottom: 2,
                  }}
                >
                  {o.society_name} · Flat {o.flat_number}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  {o.self_drop
                    ? "Method: Self drop & pickup from shop"
                    : "Method: Doorstep pickup & delivery"}
                </div>
                <div style={{ fontSize: 12, color: "#4b5563" }}>
                  {o.total_price != null ? (
                    <>
                      Amount paid:{" "}
                      <strong>₹{o.total_price}</strong>{" "}
                      {o.express_delivery && (
                        <span style={{ color: "#f97316" }}>
                          (including express)
                        </span>
                      )}
                    </>
                  ) : o.estimated_total != null ? (
                    <>
                      Estimated amount:{" "}
                      <strong>₹{o.estimated_total}</strong>{" "}
                      <span style={{ color: "#6b7280" }}>
                        (final amount after ironing)
                      </span>
                    </>
                  ) : (
                    <span style={{ color: "#6b7280" }}>
                      Amount will be confirmed on delivery or pickup.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 4,
};

const inputStyle: CSSProperties = {
  width: "100%",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  padding: "8px 10px",
  fontSize: 13,
  outline: "none",
  color: "#111827",
  backgroundColor: "white",
};
