// app/booking-confirmed/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Confirmed | Ironing Service",
  description:
    "Your ironing pickup has been booked successfully. Thank you for choosing our service!",
};

export default function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: { msg?: string };
}) {
  const message =
    searchParams.msg ||
    "Your booking is confirmed. Our team will pick up your clothes as per the selected date and time slot.";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px 16px",
        background:
          "linear-gradient(135deg, #0f172a 0%, #020617 40%, #111827 100%)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: "#020617",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
          color: "#f9fafb",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            margin: 0,
            marginBottom: 12,
          }}
        >
          Booking Confirmed 🎉
        </h1>

        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "#e5e7eb",
            whiteSpace: "pre-line",
            margin: 0,
            marginBottom: 8,
          }}
        >
          {message}
        </p>

        <p
          style={{
            fontSize: 11,
            color: "#9ca3af",
            margin: 0,
            marginBottom: 16,
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
          <Link
            href="/"
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
              textDecoration: "none",
            }}
          >
            Book Another Order
          </Link>

          <Link
            href="/"
            style={{
              borderRadius: 999,
              padding: "10px 14px",
              border: "1px solid #4b5563",
              backgroundColor: "transparent",
              color: "#e5e7eb",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            Go to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
