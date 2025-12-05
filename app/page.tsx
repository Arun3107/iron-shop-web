"use client";

import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import BookingForm from "./components/BookingForm";
import BookingConfirmation from "./components/BookingConfirmation";
import MyOrders from "./components/MyOrders";

type View = "home" | "book" | "orders" | "confirmation";

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
          <HomeScreen
            onBookClick={() => setView("book")}
            onOrdersClick={() => setView("orders")}
          />
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

      {/* Add-to-home-screen tip (unchanged) */}
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
