"use client";

export default function BookingConfirmation(props: {
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
