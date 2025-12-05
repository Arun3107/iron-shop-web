"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type CSSProperties,
  type ChangeEvent,
} from "react";
import { ITEM_PRICES } from "../admin/constants"; // same source as OrdersView

/** Admin-style price definition */
type ItemPriceDef = { label: string; price: number };

/** Cast ITEM_PRICES (object) to a typed map */
const ITEM_PRICES_MAP: Record<string, ItemPriceDef> =
  ITEM_PRICES as unknown as Record<string, ItemPriceDef>;

/** Same grouping + keys as admin OrdersView so staff see identical structure */
const ITEM_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Men clothing",
    keys: [
      "men_shirt_kurta_tshirt",
      "men_trouser_jeans_shorts_pyjama",
      "men_coat_blazer_jacket",
      "men_dhoti_lungi",
    ],
  },
  {
    title: "Women Clothing",
    keys: [
      "women_kurti_top",
      "women_leggings_pant_salwar_shorts",
      "women_dress",
      "women_simple_saree",
      "women_heavy_silk_saree",
      "women_lehenga",
    ],
  },
  {
    title: "Kids wear (below 5 years)",
    keys: ["kids_below5"],
  },
  {
    title: "Home items",
    keys: [
      "home_pillow_small_towel",
      "home_curtain_bedsheet_single",
      "home_curtain_bedsheet_double",
    ],
  },
];

type PickupSlotId = "MORNING" | "EVENING";

const PICKUP_SLOTS: { id: PickupSlotId; label: "Morning" | "Evening" }[] = [
  {
    id: "MORNING",
    label: "Morning",
  },
  {
    id: "EVENING",
    label: "Evening",
  },
];

const ADD_NEW_SOCIETY_VALUE = "__ADD_NEW_SOCIETY__";


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

type ItemsQuantities = Record<string, number>;
type ItemsDraft = Record<string, string>;

export default function BookingForm(props: {
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
  const [pickupSlotId, setPickupSlotId] = useState<PickupSlotId>("MORNING");
  const [notes, setNotes] = useState("");

  // Items state (numeric, used for totals + payload)
  const [itemsQuantities, setItemsQuantities] = useState<ItemsQuantities>({});
  // Modal state (string map for editing like admin)
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [itemsDraft, setItemsDraft] = useState<ItemsDraft>({});

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [currentInfo, setCurrentInfo] = useState({
    todayISO: "",
    hour: 0,
  });

    // Societies from Supabase
  const [societyOptions, setSocietyOptions] = useState<string[]>([]);
  const [societiesLoading, setSocietiesLoading] = useState(false);
  const [societiesError, setSocietiesError] = useState<string | null>(null);

  // "Add new society" UI
  const [isAddingSociety, setIsAddingSociety] = useState(false);
  const [newSocietyNameInput, setNewSocietyNameInput] = useState("");
  const [addSocietyError, setAddSocietyError] = useState<string | null>(null);
  const [addingSociety, setAddingSociety] = useState(false);

  // Block dropdown helpers
  const isPSRAster = society === "PSR Aster";
  const isAbheeKingsCourt = society === "ABHEE King's Court";

  const effectiveSocietyOptions = societyOptions;


  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

    // Capture "today" + hour for same-day + morning-disable logic
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

    // Load societies from /api/societies on mount (same as WalkInView)
  useEffect(() => {
    let cancelled = false;

    async function loadSocieties() {
      setSocietiesLoading(true);
      setSocietiesError(null);

      try {
        const res = await fetch("/api/societies");
        if (!res.ok) {
          throw new Error("Failed to fetch societies");
        }

        const json = await res.json();
        // API shape: { societies: [{ name: string }, ...] }
        const list = (json?.societies ?? []).map(
          (s: { name: string }) => s.name,
        ) as string[];

        if (cancelled) return;

        if (list.length > 0) {
          const sorted = [...list].sort((a, b) => a.localeCompare(b));
          setSocietyOptions(sorted);

          // If user has no society chosen yet, auto-select
          if (!society) {
            if (sorted.includes("PSR Aster")) {
              setSociety("PSR Aster");
            } else {
              setSociety(sorted[0]);
            }
          }
        } else {
          setSocietyOptions([]);
        }
      } catch (err) {
        console.error("Error loading societies", err);
        if (!cancelled) {
          setSocietiesError(
            "Could not load societies. You can still type manually.",
          );
          setSocietyOptions([]);
        }
      } finally {
        if (!cancelled) {
          setSocietiesLoading(false);
        }
      }
    }

    void loadSocieties();

    return () => {
      cancelled = true;
    };
  }, [society, setSociety]);

  function handleSocietyChange(e: ChangeEvent<HTMLSelectElement>): void {
    const value = e.target.value;

    if (value === ADD_NEW_SOCIETY_VALUE) {
      setIsAddingSociety(true);
      setAddSocietyError(null);
      return;
    }

    setSociety(value);
    setIsAddingSociety(false);
    setNewSocietyNameInput("");
    setAddSocietyError(null);
  }

  async function handleAddSociety() {
    const name = newSocietyNameInput.trim();

    if (!name) {
      setAddSocietyError("Please enter a society name.");
      return;
    }

    setAddingSociety(true);
    setAddSocietyError(null);

    try {
      const res = await fetch("/api/societies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAddSocietyError(
          data?.error || "Could not add society. Please try again.",
        );
        return;
      }

      const createdName: string = data?.society?.name ?? name;

      setSocietyOptions((prev) =>
        Array.from(new Set([...prev, createdName])).sort((a, b) =>
          a.localeCompare(b),
        ),
      );
      setSociety(createdName);
      setIsAddingSociety(false);
      setNewSocietyNameInput("");
      setAddSocietyError(null);
    } catch (err) {
      console.error("Error adding society", err);
      setAddSocietyError("Something went wrong. Please try again.");
    } finally {
      setAddingSociety(false);
    }
  }

  function handleCancelAddSociety() {
    setIsAddingSociety(false);
    setNewSocietyNameInput("");
    setAddSocietyError(null);
  }


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

  const handleLoadProfile = async (rawPhone?: string) => {
  const phoneToLoad = (rawPhone ?? phone).trim();
  if (!phoneToLoad) return;

  setLoadingProfile(true);
  try {
    const res = await fetch(
      `/api/customer?phone=${encodeURIComponent(phoneToLoad)}`,
    );
    const data = await res.json();

    if (!res.ok) {
      console.error("Could not load saved details:", data);
      return;
    }

    const c = data.customer;
    if (!c) {
      // No saved details for this number — silent, no message
      return;
    }

    if (c.customer_name) setCustomerName(c.customer_name);
if (c.society_name) setSociety(c.society_name);
setBlock(c.block ?? ""); // 👈 always override, blank if null/undefined
if (c.flat_number) setFlatNumber(c.flat_number);

  } catch (err) {
    console.error("Load profile error:", err);
  } finally {
    setLoadingProfile(false);
  }
};


  // --- Items helpers (numeric totals) ---

  const itemsTotal = Object.entries(itemsQuantities).reduce(
    (sum, [key, qty]) => {
      if (!qty || qty <= 0) return sum;
      const def = ITEM_PRICES_MAP[key];
      if (!def) return sum;
      return sum + qty * def.price;
    },
    0,
  );
  const estimatedTotal = itemsTotal || null;

  const hasItems = Object.values(itemsQuantities).some(
    (qty) => qty && qty > 0,
  );

  // --- Items modal handlers ---

  const openItemsModal = () => {
    const draft: ItemsDraft = {};
    for (const [key, qty] of Object.entries(itemsQuantities)) {
      if (qty && qty > 0) {
        draft[key] = String(qty);
      }
    }
    setItemsDraft(draft);
    setItemsModalOpen(true);
  };

  const closeItemsModal = () => {
    setItemsModalOpen(false);
  };

  const handleModalItemChange = (key: string, value: string) => {
    // allow only digits
    const cleaned = value.replace(/[^0-9]/g, "");
    setItemsDraft((prev) => ({
      ...prev,
      [key]: cleaned,
    }));
  };

  const saveItemsFromModal = () => {
    const next: ItemsQuantities = {};

    for (const [key, raw] of Object.entries(itemsDraft)) {
      if (!raw) continue;
      const num = parseInt(raw, 10);
      if (!num || num <= 0) continue;
      next[key] = num;
    }

    setItemsQuantities(next);
    setItemsModalOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (isSubmitting) return;

    if (!customerName || !phone || !flatNumber || !pickupDate) {
      setMessage("Please fill name, mobile, flat number and pickup date.");
      return;
    }

    const finalSociety = society.trim();
    if (!finalSociety) {
      setMessage("Please enter your society / apartment name.");
      return;
    }

        // Build items_json for backend (same structure admin expects)
    const itemsJson: Record<string, number> = {};
    for (const [key, qty] of Object.entries(itemsQuantities)) {
      if (qty && qty > 0) {
        itemsJson[key] = qty;
      }
    }

    // Cleaned flat + block (stored in separate columns)
    const cleanedFlat = flatNumber.trim();
    const cleanedBlock = block.trim();


    setIsSubmitting(true);

    try {
            const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          phone: phone.trim(),
          society_name: finalSociety,
          flat_number: cleanedFlat,                // 👈 only flat here
          block: cleanedBlock || null,             // 👈 separate block column
          pickup_date: pickupDate,
          // Store only "Morning" / "Evening" in DB
          pickup_slot: selectedSlot.label,
          express_delivery: false,
          self_drop: false,

          // Items + amounts
          items_json: Object.keys(itemsJson).length ? itemsJson : null,
          items_estimated_total: itemsTotal || null,
          base_amount: itemsTotal || null,         // 👈 fills base_amount column
          delivery_charge: null,
          express_charge: null,
          estimated_total: estimatedTotal,         // you can also set = itemsTotal if you prefer

          // Notes only
          notes: notes.trim() || null,
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

      const baseMsg = `Thank you! Your pickup is booked for ${pickupDate} in the ${selectedSlot.label.toLowerCase()} slot.`;

      // Show black confirmation page with this text
      props.onConfirm(baseMsg);

      // Reset non-profile fields for next booking
      setNotes("");
      setItemsQuantities({});
    } catch (err) {
      console.error("Request error:", err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
          {/* Name */}
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Mobile */}
          <div>
            <label style={labelStyle}>Mobile Number</label>
            <input
  type="tel"
  value={phone}
  onChange={(e) => {
    const next = e.target.value;
    setPhone(next);

    const trimmed = next.trim();
    // Auto-load saved details when a full number is entered (10+ digits)
    if (trimmed.length >= 10) {
      void handleLoadProfile(trimmed);
    }
  }}
  style={inputStyle}
/>
{loadingProfile && (
  <div
    style={{
      marginTop: 6,
      fontSize: 11,
      color: "#6b7280",
    }}
  >
    Loading saved details…
  </div>
)}

          </div>

                    {/* Society */}
          <div>
            <label style={labelStyle}>Society / Apartment</label>

            {societiesLoading ? (
              <div
                style={{
                  ...inputStyle,
                  display: "flex",
                  alignItems: "center",
                  color: "#6b7280",
                }}
              >
                Loading societies…
              </div>
            ) : (
              <select
                value={society}
                onChange={handleSocietyChange}
                style={inputStyle}
              >
                <option value="">Select society</option>
                {effectiveSocietyOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value={ADD_NEW_SOCIETY_VALUE}>+ Add new society</option>
              </select>
            )}

            {societiesError && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#b91c1c",
                }}
              >
                {societiesError}
              </div>
            )}

            {isAddingSociety && (
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  gap: 4,
                }}
              >
                <input
                  type="text"
                  value={newSocietyNameInput}
                  onChange={(e) => setNewSocietyNameInput(e.target.value)}
                  placeholder="New society name"
                  style={{
                    ...inputStyle,
                    flex: 1,
                    fontSize: 12,
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSociety}
                  disabled={addingSociety}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: addingSociety ? "not-allowed" : "pointer",
                    background:
                      "linear-gradient(to right, #22c55e, #16a34a, #15803d)",
                    color: "#022c22",
                    opacity: addingSociety ? 0.6 : 1,
                  }}
                >
                  {addingSociety ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelAddSociety}
                  style={{
                    borderRadius: 999,
                    border: "1px solid #d1d5db",
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: "white",
                    color: "#4b5563",
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {addSocietyError && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#b91c1c",
                }}
              >
                {addSocietyError}
              </div>
            )}
          </div>


                    {/* Block */}
          <div>
            <label style={labelStyle}>Block (optional)</label>
            {isPSRAster ? (
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select block</option>
                <option value="A">A Block</option>
                <option value="B">B Block</option>
                <option value="C">C Block</option>
                <option value="D">D Block</option>
                <option value="E">E Block</option>
                <option value="F">F Block</option>
                <option value="G">G Block</option>
              </select>
            ) : isAbheeKingsCourt ? (
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select block</option>
                <option value="A">A Block</option>
                <option value="B">B Block</option>
              </select>
            ) : (
              <input
                type="text"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                placeholder="Optional (e.g. A, B, G)"
                style={inputStyle}
              />
            )}
          </div>


          {/* Flat */}
          <div>
            <label style={labelStyle}>Flat / House Number</label>
            <input
              type="text"
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Date + Slot */}
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
                        <strong>{slot.label}</strong>
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
            </div>
          </div>

          {/* Items block with popup like admin */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 12,
              backgroundColor: "#f9fafb",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              Items (optional)
            </div>
            <button
              type="button"
              onClick={openItemsModal}
              style={{
                borderRadius: 999,
                border: "1px solid #d1d5db",
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: "white",
                color: "#111827",
                cursor: "pointer",
              }}
            >
              {hasItems ? "Edit items" : "Add items"}
            </button>
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#111827",
              }}
            >
              Items total:{" "}
              <span style={{ fontWeight: 600 }}>₹{itemsTotal}</span>
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

          {/* Notes – label simplified */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              rows={3}
              placeholder="Example: delicate clothes, please return on hangers…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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

      {itemsModalOpen && (
        <BookingItemsModal
          items={itemsDraft}
          onChange={handleModalItemChange}
          onClose={closeItemsModal}
          onSave={saveItemsFromModal}
        />
      )}
    </>
  );
}

/**
 * Popup for selecting items (same structure as admin ItemsModal,
 * but styled for light user-facing page).
 */
function BookingItemsModal(props: {
  items: ItemsDraft;
  onChange: (key: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const { items, onChange, onClose, onSave } = props;

  const handleTypedChange =
    (key: string) => (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (v === "") {
        onChange(key, "");
        return;
      }
      const cleaned = v.replace(/[^0-9]/g, "");
      onChange(key, cleaned);
    };

  const getValuePair = (key: string) => {
    const raw = items[key] ?? "";
    const num =
      raw === "" ? 0 : Number.isNaN(parseInt(raw, 10)) ? 0 : parseInt(raw, 10);
    return { raw, num };
  };

  const decrement = (key: string) => {
    const { num } = getValuePair(key);
    const next = Math.max(0, num - 1);
    onChange(key, next === 0 ? "" : String(next));
  };

  const increment = (key: string) => {
    const { num } = getValuePair(key);
    const next = num + 1;
    onChange(key, String(next));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15,23,42,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: 12,
      }}
    >
            <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          padding: 12,
          boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
          color: "#000000",
        }}
      >

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Add items</div>
            <div style={{ fontSize: 12, color: "#000000" }}>
              Select what you are sending. This helps estimate the bill.
            </div>

          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              padding: "4px 10px",
              fontSize: 12,
              backgroundColor: "white",
              color: "#6b7280",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        {/* Items list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 6,
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 10,
              fontSize: 13,
            }}
          >
            {ITEM_GROUPS.map((group) => (
              <div
                key={group.title}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  backgroundColor: "white",
                }}
              >
                {/* group header */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: "#111827",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: 4,
                  }}
                >
                  {group.title}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 8,
                  }}
                >
                  {group.keys.map((key) => {
                    const def = ITEM_PRICES_MAP[key];
                    if (!def) return null;

                    const { raw} = getValuePair(key);

                    // special label change to match admin
                    const label =
                      key === "women_kurti_top"
                        ? "Kurti / Top / Dupatta"
                        : def.label;

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>
                          {label}
                            <span style={{ color: "#000000" }}>
                            {" "}
                            — ₹{def.price}
                          </span>

                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => decrement(key)}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 999,
                              border: "1px solid #d1d5db",
                              backgroundColor: "white",
                              color: "#111827",
                              fontSize: 16,
                              lineHeight: 1,
                              cursor: "pointer",
                            }}
                          >
                            -
                          </button>
                          <input
                            type="text"
                            value={raw}
                            onChange={handleTypedChange(key)}
                            inputMode="numeric"
                            style={{
                              width: 54,
                              borderRadius: 999,
                              border: "1px solid #d1d5db",
                              backgroundColor: "white",
                              color: "#111827",
                              padding: "4px 6px",
                              fontSize: 13,
                              textAlign: "center",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => increment(key)}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 999,
                              border: "1px solid #d1d5db",
                              backgroundColor: "white",
                              color: "#111827",
                              fontSize: 16,
                              lineHeight: 1,
                              cursor: "pointer",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer buttons */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              padding: "6px 12px",
              fontSize: 12,
              backgroundColor: "white",
              color: "#6b7280",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            style={{
              borderRadius: 999,
              border: "none",
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              background:
                "linear-gradient(to right, #4ade80, #22c55e)",
              color: "#064e3b",
              cursor: "pointer",
            }}
          >
            Save items
          </button>
        </div>
      </div>
    </div>
  );
}
