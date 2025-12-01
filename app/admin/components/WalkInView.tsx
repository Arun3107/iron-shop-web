// app/admin/components/WalkInView.tsx
"use client";

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
          </div>

          {/* Block – right after flat number, type depends on society */}
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
                <option value="G">F Block</option>
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
