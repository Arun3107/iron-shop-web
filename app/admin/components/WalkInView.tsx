// app/admin/components/WalkInView.tsx
"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { filterLabelStyle, filterInputStyle } from "../styles";

interface Props {
  isMobile: boolean;
  societies: string[];
  newCustomerName: string; // flat number
  newPhone: string;
  newSociety: string;
  newBlock: string;
  creatingWalkIn: boolean;
  setNewCustomerName: (v: string) => void;
  setNewPhone: (v: string) => void;
  setNewSociety: (v: string) => void;
  setNewBlock: (v: string) => void;
  onCreateWalkIn: () => void;
}

type CustomerMatch = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  society_name: string | null;
  flat_number: string | null;
  block: string | null;
};

const ADD_NEW_VALUE = "__ADD_NEW_SOCIETY__";

export default function WalkInView({
  isMobile,
  societies,
  newCustomerName,
  newPhone,
  newSociety,
  newBlock,
  creatingWalkIn,
  setNewCustomerName,
  setNewPhone,
  setNewSociety,
  setNewBlock,
  onCreateWalkIn,
}: Props) {
  const isPSRAster = newSociety === "PSR Aster";

  // Societies list (from /api/societies, with fallback to societies prop)
  const [societyOptions, setSocietyOptions] = useState<string[]>([]);
  const [societiesLoading, setSocietiesLoading] = useState(false);
  const [societiesError, setSocietiesError] = useState<string | null>(null);

  // "Add new society" UI state
  const [isAddingSociety, setIsAddingSociety] = useState(false);
  const [newSocietyNameInput, setNewSocietyNameInput] = useState("");
  const [addSocietyError, setAddSocietyError] = useState<string | null>(null);
  const [addingSociety, setAddingSociety] = useState(false);

  // Customer lookup state
  const [customerMatches, setCustomerMatches] = useState<CustomerMatch[]>([]);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [customerLookupError, setCustomerLookupError] =
    useState<string | null>(null);

  // Load societies from /api/societies on mount
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
        const list = (json?.societies ?? []).map(
          (s: { name: string }) => s.name
        ) as string[];

        if (cancelled) return;

        if (list.length > 0) {
          const sorted = [...list].sort((a, b) => a.localeCompare(b));
          setSocietyOptions(sorted);

          if (!newSociety) {
            if (sorted.includes("PSR Aster")) {
              setNewSociety("PSR Aster");
            } else {
              setNewSociety(sorted[0]);
            }
          }
        } else {
          const fallback = Array.from(new Set(societies)).sort();
          setSocietyOptions(fallback);
        }
      } catch (err) {
        console.error("Error loading societies", err);
        if (!cancelled) {
          setSocietiesError("Could not load societies. You can still proceed.");
          const fallback = Array.from(new Set(societies)).sort();
          setSocietyOptions(fallback);
        }
      } finally {
        if (!cancelled) {
          setSocietiesLoading(false);
        }
      }
    }

    loadSocieties();

    return () => {
      cancelled = true;
    };
  }, [societies, newSociety, setNewSociety]);

  const effectiveSocietyOptions =
    societyOptions.length > 0
      ? societyOptions
      : Array.from(new Set(societies)).sort();

  function handleSocietyChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ): void {
    const value = event.target.value;

    if (value === ADD_NEW_VALUE) {
      setIsAddingSociety(true);
      setAddSocietyError(null);
      return;
    }

    setNewSociety(value);
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
          data?.error || "Could not add society. Please try again."
        );
        return;
      }

      const createdName: string = data?.society?.name ?? name;

      setSocietyOptions((prev) =>
        Array.from(new Set([...prev, createdName])).sort((a, b) =>
          a.localeCompare(b)
        )
      );
      setNewSociety(createdName);
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

  function applyCustomerMatch(match: CustomerMatch) {
    if (match.flat_number) {
      setNewCustomerName(match.flat_number);
    }
    if (match.block) {
      setNewBlock(match.block);
    }
    if (match.phone) {
      setNewPhone(match.phone);
    }
    if (match.society_name) {
      setNewSociety(match.society_name);
    }
  }

  // When flat + society change, try to look up an existing customer
  useEffect(() => {
    const flat = newCustomerName.trim();
    const society = newSociety.trim();

    if (!flat || !society) {
      setCustomerMatches([]);
      setCustomerLookupError(null);
      setCustomerLookupLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      setCustomerLookupLoading(true);
      setCustomerLookupError(null);

      try {
        const params = new URLSearchParams({
          society,
          flat,
        });

        const res = await fetch(`/api/admin/customers?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Failed to lookup customer");
        }

        const json = await res.json();
        if (cancelled) return;

        const matches = (json?.matches ?? []) as CustomerMatch[];
        setCustomerMatches(matches);

        // If we have exactly one match, auto-fill details (always overwrite)
if (matches.length === 1) {
  const m = matches[0];

  if (m.phone) {
    setNewPhone(m.phone);
  }

  if (m.block) {
    setNewBlock(m.block);
  } else {
    // If the matched record has no block, clear it so staff can enter.
    setNewBlock("");
  }

  if (m.flat_number) {
    setNewCustomerName(m.flat_number);
  }

  if (m.society_name) {
    setNewSociety(m.society_name);
  }
}

      } catch (err: unknown) {
        if (cancelled) return;
        console.error("Error looking up customer", err);
        setCustomerLookupError("Could not check existing customers.");
        setCustomerMatches([]);
      } finally {
        if (!cancelled) {
          setCustomerLookupLoading(false);
        }
      }
    }, 400); // small debounce so we don't call on every keystroke

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [
    newCustomerName,
    newSociety,
    newPhone,
    newBlock,
    setNewPhone,
    setNewBlock,
    setNewCustomerName,
    setNewSociety,
  ]);

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
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
            For customers who directly drop clothes at the shop.
          </div>
        </div>

        {/* Inputs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(4, minmax(0, 1fr))",
            gap: 8,
            fontSize: 12,
          }}
        >
          {/* Flat number (used as name + flat_number) */}
          <div>
            <label style={filterLabelStyle}>Flat number</label>
            <input
              type="text"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="G7, T16, S79 etc."
              style={filterInputStyle}
            />

            {customerLookupLoading &&
              newCustomerName.trim() &&
              newSociety.trim() && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  Checking existing customers…
                </div>
              )}

            {!customerLookupLoading && customerMatches.length === 1 && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#22c55e",
                }}
              >
                Existing customer matched. Details auto-filled.
              </div>
            )}

            {!customerLookupLoading && customerMatches.length > 1 && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#e5e7eb",
                }}
              >
                We found multiple existing customers for this flat:
                <div
                  style={{
                    marginTop: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {customerMatches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => applyCustomerMatch(m)}
                      style={{
                        textAlign: "left",
                        borderRadius: 999,
                        border: "1px solid #4b5563",
                        padding: "4px 8px",
                        fontSize: 11,
                        background: "rgba(15,23,42,0.85)",
                        color: "#e5e7eb",
                        cursor: "pointer",
                      }}
                    >
                      {(m.flat_number || "").toString()}{" "}
                      {m.block ? `, ${m.block} Block` : ""}{" "}
                      {m.phone ? `• ${m.phone}` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {customerLookupError && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#fca5a5",
                }}
              >
                {customerLookupError}
              </div>
            )}
          </div>

          {/* Block */}
          <div>
            <label style={filterLabelStyle}>Block</label>
            {isPSRAster ? (
              <select
                value={newBlock}
                onChange={(e) => setNewBlock(e.target.value)}
                style={filterInputStyle}
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
            ) : (
              <input
                type="text"
                value={newBlock}
                onChange={(e) => setNewBlock(e.target.value)}
                placeholder="Optional (e.g. A, B, G)"
                style={filterInputStyle}
              />
            )}
          </div>

          {/* Phone */}
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

          {/* Society */}
          <div>
            <label style={filterLabelStyle}>Society</label>

            {societiesLoading ? (
              <div
                style={{
                  ...filterInputStyle,
                  display: "flex",
                  alignItems: "center",
                  color: "#9ca3af",
                }}
              >
                Loading societies…
              </div>
            ) : (
              <select
                value={newSociety}
                onChange={handleSocietyChange}
                style={filterInputStyle}
              >
                <option value="">Select society</option>
                {effectiveSocietyOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value={ADD_NEW_VALUE}>+ Add new society</option>
              </select>
            )}

            {societiesError && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "#fca5a5",
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
                    ...filterInputStyle,
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
                    border: "1px solid #4b5563",
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: "transparent",
                    color: "#e5e7eb",
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
                  color: "#fca5a5",
                }}
              >
                {addSocietyError}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onCreateWalkIn}
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
    </div>
  );
}
