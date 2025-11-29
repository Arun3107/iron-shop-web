"use client";
import Image from "next/image";
import { useEffect, useState, type FormEvent, type CSSProperties } from "react";

const PICKUP_SLOTS = [
  {
    id: "MORNING",
    label: "Morning",
    timeRange: "9:00 AM – 11:00 AM",
  },
  {
    id: "EVENING",
    label: "Evening",
    timeRange: "5:00 PM – 7:00 PM",
  },
];

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

type View = "home" | "book" | "orders" | "confirmation";

/**
 * Earliest pickup date:
 *  - Same-day booking allowed until 5 PM
 *  - After 5 PM → earliest available date is tomorrow
 */
function getEarliestPickupDateISO() {
  const now = new Date();
  const earliest = new Date(now);

  if (now.getHours() >= 17) {
    earliest.setDate(earliest.getDate() + 1);
  }

  return earliest.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [confirmationMessage, setConfirmationMessage] = useState("");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px 16px",
        background:
          "linear-gradient(135deg, #fef3c7 0%, #e5e7eb 35%, #f9fafb 100%)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor:
            view === "confirmation" ? "#020617" : "rgba(255,255,255,0.96)",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 16px 40px rgba(0,0,0,0.14)",
          backdropFilter: "blur(6px)",
          color: view === "confirmation" ? "#f9fafb" : "inherit",
        }}
      >
        {view === "home" && (
  <>
    <div style={{ marginBottom: 16 }}>
      <Image
        src="/laundry-banner.svg"
        alt="Laundry and dry cleaning"
        width={1200}
        height={628}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: 16,
          display: "block",
        }}
        priority
      />
    </div>

    <HomeScreen
      onBookClick={() => setView("book")}
      onOrdersClick={() => setView("orders")}
    />
  </>
)}


        {view === "book" && (
          <BookingForm
            onBack={() => setView("home")}
            onConfirm={(msg) => {
              setConfirmationMessage(msg);
              setView("confirmation");
            }}
          />
        )}

        {view === "orders" && <MyOrders onBack={() => setView("home")} />}

        {view === "confirmation" && (
          <BookingConfirmation
            message={confirmationMessage}
            onBookNew={() => setView("book")}
            onHome={() => setView("home")}
          />
        )}
      </div>

      {/* Add-to-home-screen tip (visible under the card on mobile) */}
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          marginTop: 10,
          fontSize: 11,
          color: "#4b5563",
          textAlign: "center",
        }}
      >
        <strong>Tip:</strong> To use this quickly every day, add it to your{" "}
        <strong>Home Screen</strong>:
        <br />
        On <strong>Android (Chrome)</strong>: menu ⋮ →{" "}
        <strong>Add to Home screen</strong>.
        <br />
        On <strong>iPhone (Safari)</strong>: share icon →{" "}
        <strong>Add to Home Screen</strong>.
      </div>
    </main>
  );
}

/* ---------- HOME SCREEN ---------- */

function HomeScreen(props: { onBookClick: () => void; onOrdersClick: () => void }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Thumbnail rate card */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          display: "grid",
          gap: 10,
        }}
      >
        {/* Header */}
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
                fontSize: 15,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Rate Card (Popular Items)
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 2,
              }}
            >
              Per-piece steam ironing – simple, transparent pricing.
            </div>
          </div>
          <div
            style={{
              minWidth: 36,
              minHeight: 36,
              borderRadius: 999,
              background:
                "radial-gradient(circle at 30% 20%, #38bdf8, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 18,
            }}
          >
            🧺
          </div>
        </div>

        {/* 2 × 5 thumbnails */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            fontSize: 12,
            color: "#111827",
          }}
        >
          {/* 1. Shirt / Pant */}
          <RateTile
            icon="👕"
            iconBg="#e0f2fe"
            title="Shirt / Pant"
            subtitle="₹10 per piece"
          />

          {/* 2. Kurti / Top */}
          <RateTile
            icon="👚"
            iconBg="#fef3c7"
            title="Kurti / Top"
            subtitle="₹10 per piece"
          />

          {/* 3. Kids wear */}
          <RateTile
            icon="🧒"
            iconBg="#fee2e2"
            title="Kids wear (below 5)"
            subtitle="₹8 per piece"
          />

          {/* 4. Cushion / Towel */}
          <RateTile
            icon="🧻"
            iconBg="#e5e7eb"
            title="Cushion / Small towel"
            subtitle="₹5 per piece"
          />

          {/* 5. Bedsheet Single */}
          <RateTile
            icon="🛏️"
            iconBg="#dcfce7"
            title="Bedsheet (Single)"
            subtitle="₹30 per piece"
          />

          {/* 6. Bedsheet Double */}
          <RateTile
            icon="🛏️"
            iconBg="#bfdbfe"
            title="Bedsheet (Double)"
            subtitle="₹45 per piece"
          />

          {/* 7. Simple Saree */}
          <RateTile
            icon="🥻"
            iconBg="#f3e8ff"
            title="Simple Saree"
            subtitle="₹45 per piece"
          />

          {/* 8. Heavy / Silk Saree */}
          <RateTile
            icon="🥻"
            iconBg="#fee2e2"
            title="Heavy / Silk Saree"
            subtitle="₹60 per piece"
          />

          {/* 9. Coat / Blazer */}
          <RateTile
            icon="🧥"
            iconBg="#e0f2fe"
            title="Coat / Blazer"
            subtitle="₹50 per piece"
          />

          {/* 10. Jacket */}
          <RateTile
            icon="🧥"
            iconBg="#d1fae5"
            title="Jacket"
            subtitle="₹50 per piece"
          />
        </div>

        <div
          style={{
            fontSize: 11,
            color: "#6b7280",
            marginTop: 4,
          }}
        >
          * Detailed rate card (including other items) is available at the shop.
        </div>
      </div>

            {/* Free pickup note */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: 15,
          color: "#0f172a",
        }}
      >
        Free Pickup & Drop — No Minimum Order
      </div>


      {/* Buttons */}
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
            border: "none",
            padding: "14px 0",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            background:
              "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #7c2d12 100%)",
            color: "white",
          }}
        >
          Book New
        </button>

        <button
          type="button"
          onClick={props.onOrdersClick}
          style={{
            borderRadius: 999,
            padding: "14px 0",
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            color: "#1e293b",
            fontSize: 15,
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

/* Small helper component inside the same file */
function RateTile(props: {
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          backgroundColor: props.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        {props.icon}
      </div>
      <div>
        <div style={{ fontWeight: 600 }}>{props.title}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>
          {props.subtitle}
        </div>
      </div>
    </div>
  );
}




/* ---------- BOOKING FORM ---------- */

function BookingForm(props: {
  onBack: () => void;
  onConfirm: (message: string) => void;
}) {
  const earliestPickupDate = getEarliestPickupDateISO();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [society, setSociety] = useState("");
  const [block, setBlock] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [pickupDate, setPickupDate] = useState(earliestPickupDate);
  const [pickupSlotId, setPickupSlotId] = useState<string>("MORNING");
  const [itemsText, setItemsText] = useState("");
  const [message, setMessage] = useState("");

  const [useEstimator, setUseEstimator] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [currentInfo, setCurrentInfo] = useState({
    todayISO: "",
    hour: 0,
  });

  // Dynamic societies + loading state
  const [societies, setSocieties] = useState<string[]>([]);
  const [loadingSocieties, setLoadingSocieties] = useState(false);

  // Prevent double-submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    setCurrentInfo({
      todayISO: now.toISOString().slice(0, 10),
      hour: now.getHours(),
    });
  }, []);

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
        if (parsed.block) setBlock(parsed.block);
        if (parsed.flatNumber) setFlatNumber(parsed.flatNumber);
      } catch (e) {
        console.warn("Failed to parse saved user info", e);
      }
    }
  }, []);

  // Load societies from Supabase via /api/societies
  useEffect(() => {
    const loadSocieties = async () => {
      try {
        setLoadingSocieties(true);
        const res = await fetch("/api/societies");
        const data = await res.json();
        if (res.ok && Array.isArray(data.societies)) {
          setSocieties(data.societies as string[]);
        }
      } catch (err) {
        console.error("Failed to load societies", err);
      } finally {
        setLoadingSocieties(false);
      }
    };

    void loadSocieties();
  }, []);

  const saveUserInfo = () => {
    if (typeof window === "undefined") return;
    const payload = {
      customerName,
      phone,
      society,
      block,
      flatNumber,
    };
    window.localStorage.setItem("ironingUserInfo", JSON.stringify(payload));
  };

  const selectedSlot =
    PICKUP_SLOTS.find((s) => s.id === pickupSlotId) ?? PICKUP_SLOTS[0];

  const isToday = pickupDate === currentInfo.todayISO;
  const morningDisabled = isToday && currentInfo.hour >= 10;

  // If morning becomes disabled while it's selected, switch to evening
  useEffect(() => {
    if (morningDisabled && pickupSlotId === "MORNING") {
      setPickupSlotId("EVENING");
    }
  }, [morningDisabled, pickupSlotId]);

  const handleLoadProfile = async () => {
    if (!phone.trim()) {
      setMessage("Enter your mobile number first to load saved details.");
      return;
    }

    setLoadingProfile(true);
    setMessage("");
    try {
      const res = await fetch(
        `/api/customer?phone=${encodeURIComponent(phone.trim())}`,
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

    if (isSubmitting) return; // avoid duplicate orders

    if (!customerName || !phone || !flatNumber || !pickupDate) {
      setMessage("Please fill name, mobile, flat number and pickup date.");
      return;
    }

    const finalSociety = society.trim();
    if (!finalSociety) {
      setMessage("Please enter your society / apartment name.");
      return;
    }

    const itemsTotal = PRICE_ITEMS.reduce(
      (sum, item) => sum + (quantities[item.id] || 0) * item.price,
      0,
    );
    const estimatedTotal = itemsTotal;

    // Combine block + flat number for now (backend only has flat_number)
    const combinedFlat =
      block.trim() && flatNumber.trim()
        ? `${block.trim()}, ${flatNumber.trim()}`
        : flatNumber.trim();

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          phone: phone.trim(),
          society_name: finalSociety,
          flat_number: combinedFlat,
          pickup_date: pickupDate,
          pickup_slot: selectedSlot.timeRange,
          express_delivery: false,
          self_drop: false,
          notes: itemsText.trim() || null,
          items_estimated_total: itemsTotal || null,
          delivery_charge: null,
          express_charge: null,
          estimated_total: estimatedTotal || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Order save error:", data);
        setMessage(data.error || "Failed to place order. Please try again.");
        return;
      }

      // Fire-and-forget: save society into Supabase for future suggestions
      void fetch("/api/societies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalSociety }),
      });

      saveUserInfo();

      const baseMsg = `Thank you! Your pickup is booked for ${pickupDate} in the ${selectedSlot.label.toLowerCase()} slot (${selectedSlot.timeRange}).`;

      // Show black confirmation page with this text
      props.onConfirm(baseMsg);

      // Reset local fields for next booking
      setItemsText("");
      setUseEstimator(false);
      setQuantities({});
    } catch (err) {
      console.error("Request error:", err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQtyChange = (id: string, raw: string) => {
    // allow blank input, keep number in state
    const cleaned = raw.replace(/\D/g, "");
    const num = cleaned === "" ? 0 : parseInt(cleaned, 10);
    setQuantities((prev) => ({
      ...prev,
      [id]: Number.isNaN(num) ? 0 : num,
    }));
  };

  const itemsTotal = PRICE_ITEMS.reduce(
    (sum, item) => sum + (quantities[item.id] || 0) * item.price,
    0,
  );
  const estimatedTotal = itemsTotal;

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
          Book
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
          <input
            type="text"
            list="society-options"
            placeholder="Example: PSR Aster"
            value={society}
            onChange={(e) => setSociety(e.target.value)}
            style={inputStyle}
          />
          <datalist id="society-options">
            {societies.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {loadingSocieties && (
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              Loading popular societies…
            </div>
          )}
          {!loadingSocieties && societies.length > 0 && (
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "#6b7280",
              }}
            >
              Start typing and pick from suggestions, or enter a new name.
            </div>
          )}
        </div>

        {/* Block field */}
        <div>
          <label style={labelStyle}>Block (optional)</label>
          <input
            type="text"
            value={block}
            onChange={(e) => setBlock(e.target.value)}
            placeholder="Example: A Block, Tower 1"
            style={inputStyle}
          />
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
              min={earliestPickupDate}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Pickup Time</label>
            <div
              style={{
                marginTop: 6,
                display: "grid",
                gap: 4,
                fontSize: 13,
                color: "#111827",
              }}
            >
              {PICKUP_SLOTS.map((slot) => {
                const isMorning = slot.id === "MORNING";
                const disabled = isMorning && morningDisabled;

                return (
                  <label
                    key={slot.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      opacity: disabled ? 0.4 : 1,
                    }}
                  >
                    <input
                      type="radio"
                      name="pickupSlot"
                      value={slot.id}
                      checked={pickupSlotId === slot.id}
                      onChange={() => setPickupSlotId(slot.id)}
                      disabled={disabled}
                    />
                    <span>
                      <strong>{slot.label}</strong>{" "}
                      <span style={{ color: "#6b7280" }}>{slot.timeRange}</span>
                      {disabled && (
                        <span
                          style={{
                            marginLeft: 4,
                            fontSize: 11,
                            color: "#9ca3af",
                          }}
                        >
                          (closed for today)
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
              (Choose morning or evening slot)
            </div>
          </div>
        </div>

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
              {PRICE_ITEMS.map((item) => {
                const qty = quantities[item.id] || 0;
                return (
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
                      inputMode="numeric"
                      value={qty === 0 ? "" : qty}
                      onChange={(e) => handleQtyChange(item.id, e.target.value)}
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
                );
              })}
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
          disabled={isSubmitting}
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
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.65 : 1,
          }}
        >
          {isSubmitting ? "Booking…" : "Book"}
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
    </div>
  );
}


function BookingConfirmation(props: {
  message: string;
  onBookNew: () => void;
  onHome: () => void;
}) {
  return (
    <div
      style={{
        minHeight: 260,
        display: "grid",
        gap: 16,
        alignContent: "center",
        textAlign: "center",
      }}
    >
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          margin: 0,
          marginBottom: 8,
        }}
      >
        Booking Confirmed
      </h2>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: "#e5e7eb",
          whiteSpace: "pre-line",
          margin: 0,
        }}
      >
        {props.message}
      </p>

      <p
        style={{
          fontSize: 11,
          color: "#9ca3af",
          margin: 0,
        }}
      >
        You will also receive a WhatsApp update once your clothes are ready.
      </p>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={props.onBookNew}
          style={{
            borderRadius: 999,
            padding: "10px 14px",
            border: "none",
            background:
              "linear-gradient(135deg, #f97316 0%, #ea580c 40%, #7c2d12 100%)",
            color: "white",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Book Another Order
        </button>

        <button
          type="button"
          onClick={props.onHome}
          style={{
            borderRadius: 999,
            padding: "10px 14px",
            border: "1px solid #4b5563",
            backgroundColor: "transparent",
            color: "#e5e7eb",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Go to Home
        </button>
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
        `/api/my-orders?phone=${encodeURIComponent(phone.trim())}`,
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
                      Amount paid: <strong>₹{o.total_price}</strong>{" "}
                      {o.express_delivery && (
                        <span style={{ color: "#f97316" }}>
                          (including express)
                        </span>
                      )}
                    </>
                  ) : o.estimated_total != null ? (
                    <>
                      Estimated amount: <strong>₹{o.estimated_total}</strong>{" "}
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

/* ---------- SHARED INPUT STYLES ---------- */

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
