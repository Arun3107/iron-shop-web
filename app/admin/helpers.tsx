// app/admin/helpers.tsx
"use client";

import type { OrderStatus, Order } from "./types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  let bg = "#1f2937";
  let text = "#e5e7eb";

  if (status === "NEW") {
    bg = "#1d4ed8";
    text = "#dbeafe";
  } else if (status === "PICKED") {
    bg = "#f97316";
    text = "#ffedd5";
  } else if (status === "READY") {
    bg = "#a855f7";
    text = "#f5e9ff";
  } else if (status === "DELIVERED") {
    bg = "#16a34a";
    text = "#dcfce7";
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        backgroundColor: bg,
        color: text,
      }}
    >
      {status}
    </span>
  );
}

function normalisePhoneForWhatsApp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) {
    // assume Indian mobile without country code
    return `91${digits}`;
  }
  // if already starts with 91 and long enough, use as-is
  if (digits.startsWith("91") && digits.length >= 12) {
    return digits;
  }
  return digits;
}

export function openWhatsApp(
  order: Order,
  total: number,
  discountPercent: number,
  itemsText?: string
) {
  if (typeof window === "undefined") return;
  const phone = normalisePhoneForWhatsApp(order.phone);
  if (!phone) return;

  const isReady = order.status === "READY";
  const isDelivered = order.status === "DELIVERED";

  let statusLine: string;
  if (isReady) {
    if (order.self_drop) {
      // Customer dropped clothes at shop
      statusLine =
        "Your ironing order is READY for pickup at the shop.";
    } else {
      // We picked up from customer
      statusLine =
        "Your ironing order is READY. We will deliver it to your flat shortly.";
    }
  } else if (isDelivered) {
    statusLine =
      "Your ironing order has been DELIVERED. Hope you are happy with the service.";
  } else {
    statusLine = "Your ironing order update.";
  }

  const discountLine =
    discountPercent && discountPercent > 0
      ? `Discount applied: ${discountPercent}%.\n`
      : "";

  // Build UPI deep link (works with GPay, PhonePe, Paytm, BHIM, etc)
  const upiLink = `upi://pay?pa=shukla354@okicici&pn=${encodeURIComponent(
    "Iron Shop"
  )}&am=${encodeURIComponent(String(total))}&cu=INR&tn=${encodeURIComponent(
    `Iron order – ${order.society_name} ${order.flat_number}`
  )}`;

  const paymentLine = `Total amount: ₹${total}.\nYou can pay via UPI to shukla354@okicici.\nPay easily using any UPI app (GPay, PhonePe, Paytm, BHIM etc.):\n${upiLink}`;

  const itemsSection =
    itemsText && itemsText.trim().length > 0
      ? `\nItems:\n${itemsText}\n`
      : "";

  const thanksLine = "Thank you for choosing us!";

  const text = `${statusLine}\n\n${discountLine}${paymentLine}${itemsSection}\n${thanksLine}`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

export function getWeekRange(date: string): { from: string; to: string } {
  const current = new Date(date + "T00:00:00");
  const day = current.getDay(); // 0 (Sun) to 6 (Sat)
  const diffToMonday = (day + 6) % 7; // how many days to go back to Monday
  const monday = new Date(current);
  monday.setDate(current.getDate() - diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    from: monday.toISOString().slice(0, 10),
    to: sunday.toISOString().slice(0, 10),
  };
}

export function getMonthRange(date: string): { from: string; to: string } {
  const current = new Date(date + "T00:00:00");
  const year = current.getFullYear();
  const month = current.getMonth(); // 0-based
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}
