import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function buildVariantLabel(color: string | null, size: string | null): string {
  const parts = [color, size].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Standard";
}

export const ADMIN_WHATSAPP = "2349132996389";

export function buildWhatsAppOrderMessage(
  orderId: string,
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  items: Array<{ title: string; variant: string | null; qty: number; price: number }>,
  total: number
): string {
  const itemLines = items
    .map((i) => `  • ${i.title}${i.variant ? ` (${i.variant})` : ""} x${i.qty} — ₦${i.price.toLocaleString()}`)
    .join("\n");

  return encodeURIComponent(
    `🛍️ *NEW ORDER — MIMIS FASHION HUB*\n\n` +
    `Order ID: #${orderId.slice(0, 8).toUpperCase()}\n\n` +
    `👤 *Customer:* ${customerName}\n` +
    `📞 *Phone:* ${customerPhone}\n` +
    `📍 *Address:* ${customerAddress}\n\n` +
    `🛒 *Items:*\n${itemLines}\n\n` +
    `💰 *Total:* ₦${total.toLocaleString()}\n\n` +
    `Please confirm the order and arrange delivery. Thank you! 🙏`
  );
}
