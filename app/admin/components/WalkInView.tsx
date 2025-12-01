// app/admin/components/WalkInView.tsx
"use client";


import { filterLabelStyle, filterInputStyle } from "../styles";

interface Props {
  isMobile: boolean;
  // date + walkInOrders removed – this tab only adds new walk-ins now
  societies: string[];
  newCustomerName: string;
  newPhone: string;
  newSociety: string;
  creatingWalkIn: boolean;
  setNewCustomerName: (v: string) => void;
  setNewPhone: (v: string) => void;
  setNewSociety: (v: string) => void;
  onCreateWalkIn: () => void;
}

export default function WalkInView({
  isMobile,
  societies,
  newCustomerName,
  newPhone,
  newSociety,
  creatingWalkIn,
  setNewCustomerName,
  setNewPhone,
  setNewSociety,
  onCreateWalkIn,
}: Props) {
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(3, minmax(0, 1fr))",
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
        </div>

        {/* Express checkbox removed for walk-ins */}

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
