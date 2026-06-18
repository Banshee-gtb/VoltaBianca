import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, buildWhatsAppOrderMessage, ADMIN_WHATSAPP } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 1500));

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_address: form.address.trim(),
        delivery_notes: form.notes.trim() || null,
        amount_paid: total,
        paystack_reference: `MOCK-${Date.now()}`,
        status: "paid",
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error("Failed to place order. Please try again.");
      setLoading(false);
      return;
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      product_title: item.title,
      variant_label: item.variantLabel,
      quantity: item.quantity,
      price: item.price,
    }));

    await supabase.from("order_items").insert(orderItems);

    // Send WhatsApp notification to admin
    const waItems = items.map((i) => ({
      title: i.title,
      variant: i.variantLabel,
      qty: i.quantity,
      price: i.price * i.quantity,
    }));
    const waMsg = buildWhatsAppOrderMessage(
      order.id, form.name, form.phone, form.address, waItems, total
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${waMsg}`, "_blank");

    clearCart();
    setLoading(false);
    navigate(`/order-confirmation?id=${order.id}&name=${encodeURIComponent(form.name)}`);
  }

  if (items.length === 0) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <ShoppingBag size={56} className="mx-auto text-foreground/20 mb-4" strokeWidth={1} />
        <h1 className="font-heading text-3xl font-light mb-3">Your bag is empty</h1>
        <Link to="/products" className="btn-primary">Shop Now</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} /> Continue Shopping
        </Link>

        <h1 className="font-heading text-4xl font-light mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Form */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-3 space-y-5">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-heading text-xl font-medium mb-5">Delivery Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full Name <span className="text-red-400">*</span></label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+234..."
                    required
                    className="input-field"
                  />
                  <p className="text-xs text-foreground/40 mt-1">We'll contact you for delivery coordination</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Delivery Address <span className="text-red-400">*</span></label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Street address, city, state..."
                    required
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Delivery Notes <span className="text-foreground/30">(optional)</span></label>
                  <input
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Any special instructions?"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-heading text-xl font-medium mb-5">Payment</h2>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-blue/10 border border-brand-blue/30">
                <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📱</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-blue-deep">Pay on Delivery / WhatsApp</p>
                  <p className="text-xs text-foreground/50 mt-0.5">We'll confirm your order and arrange payment on delivery</p>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4">
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Processing Order...</>
              ) : (
                `Place Order — ${formatPrice(total)}`
              )}
            </button>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h2 className="font-heading text-xl font-medium mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={`${item.productId}__${item.variantId}`} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-2 flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={16} className="text-foreground/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {item.variantLabel && <p className="text-xs text-foreground/40">{item.variantLabel}</p>}
                      <p className="text-xs text-foreground/50 mt-0.5">×{item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm text-foreground/60">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-foreground/60">
                  <span>Delivery</span>
                  <span className="text-green-500">Arranged via WhatsApp</span>
                </div>
                <div className="flex justify-between font-heading text-xl font-medium pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-brand-blue-deep">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
