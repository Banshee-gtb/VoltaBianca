import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";
import { ADMIN_WHATSAPP } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const orderId = params.get("id");
  const name = params.get("name") ?? "Customer";
  const shortId = orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : "";

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>

        <h1 className="font-heading text-4xl font-light mb-3">
          Thank you, {name.split(" ")[0]}!
        </h1>

        <p className="text-foreground/60 mb-2">Your order has been placed successfully.</p>

        {shortId && (
          <div className="inline-block glass-card rounded-xl px-6 py-3 my-6">
            <p className="text-sm text-foreground/50">Order Reference</p>
            <p className="font-heading text-2xl font-medium text-brand-blue-deep">{shortId}</p>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-heading text-lg font-medium mb-3">What happens next?</h2>
          <ol className="space-y-3">
            {[
              "Your order details have been sent to us via WhatsApp",
              "We will confirm your order and contact you for delivery",
              "Payment on delivery — we'll discuss delivery charges",
              "Your items will be shipped to your address",
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground/70">
                <span className="w-6 h-6 rounded-full bg-brand-blue/20 text-brand-blue-deep text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`https://wa.me/${ADMIN_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <MessageCircle size={18} /> Track via WhatsApp
          </a>
          <Link to="/products" className="btn-secondary">
            <ShoppingBag size={18} /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
