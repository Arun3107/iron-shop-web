"use client";

import Image from "next/image";

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
        gap: 10,
        alignItems: "center",
        padding: "10px 10px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "linear-gradient(135deg, #f9fafb 0%, #eff6ff 80%)",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          backgroundColor: props.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        {props.icon}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{props.title}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>{props.subtitle}</div>
      </div>
    </div>
  );
}

export default function HomeScreen(props: {
  onBookClick: () => void;
  onOrdersClick: () => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 18,
        paddingBottom: 16,
      }}
    >
      {/* Banner – full width, no curved edges */}
      <div style={{ marginBottom: 4 }}>
        <Image
          src="/laundry-banner.svg"
          alt="Laundry and dry cleaning"
          width={1200}
          height={628}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: 0, // no curved edges
          }}
          priority
        />
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
            boxShadow: "0 10px 24px rgba(124, 45, 18, 0.35)",
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
            backgroundColor: "#ffffff",
            color: "#1e293b",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(148, 163, 184, 0.25)",
          }}
        >
          My Orders
        </button>
      </div>

      {/* Free pickup note – premium band */}
      <div
        style={{
          borderRadius: 12,
          padding: "10px 12px",
          textAlign: "center",
          fontWeight: 700,
          fontSize: 14,
          color: "#0f172a",
          background:
            "linear-gradient(135deg, #eef2ff 0%, #e0f2fe 40%, #dcfce7 100%)",
          boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
        }}
      >
        Free Pickup & Drop — No Minimum Order
      </div>

      {/* Tuesday Closed note – premium band */}
      <div
        style={{
          borderRadius: 12,
          padding: "10px 12px",
          textAlign: "center",
          fontWeight: 700,
          fontSize: 14,
          color: "#f9fafbff",
          background:
            "linear-gradient(135deg, #0d0e0fff 0%, #17374dff 40%, #0a0d0bff 100%)",
          boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
        }}
      >
        We are closed every Tuesday. Please plan accordingly
      </div>

      {/* Intro + rate tiles (no big outer box) */}
      <section
        style={{
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
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Popular Rates
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 2,
              }}
            >
              Per-piece steam ironing — simple, transparent pricing.
            </div>
          </div>
          <div
            style={{
              minWidth: 40,
              minHeight: 40,
              borderRadius: 999,
              background:
                "radial-gradient(circle at 30% 20%, #38bdf8, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 20,
            }}
          >
            🧺
          </div>
        </div>

        {/* 2 × 5 thumbnails – small premium tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            fontSize: 12,
            color: "#111827",
          }}
        >
          <RateTile
            icon="👕"
            iconBg="#e0f2fe"
            title="Shirt / Pant"
            subtitle="₹10 per piece"
          />
          <RateTile
            icon="👚"
            iconBg="#fef3c7"
            title="Kurti / Frock"
            subtitle="₹15 per piece"
          />
          <RateTile
            icon="🧒"
            iconBg="#fee2e2"
            title="Kids wear (below 5)"
            subtitle="₹8 per piece"
          />
          <RateTile
            icon="🧻"
            iconBg="#e5e7eb"
            title="Cushion / Small towel"
            subtitle="₹5 per piece"
          />
          <RateTile
            icon="🛏️"
            iconBg="#dcfce7"
            title="Bedsheet (Single)"
            subtitle="₹30 per piece"
          />
          <RateTile
            icon="🛏️"
            iconBg="#bfdbfe"
            title="Bedsheet (Double)"
            subtitle="₹45 per piece"
          />
          <RateTile
            icon="🥻"
            iconBg="#f3e8ff"
            title="Simple Saree"
            subtitle="₹45 per piece"
          />
          <RateTile
            icon="🥻"
            iconBg="#fee2e2"
            title="Heavy / Silk Saree"
            subtitle="₹60 per piece"
          />
          <RateTile
            icon="🧥"
            iconBg="#e0f2fe"
            title="Coat / Blazer"
            subtitle="₹50 per piece"
          />
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
            marginTop: 2,
          }}
        >
          * Full rate card (all items) is available at the shop.
        </div>
      </section>
    
    </div>
  );
}
