import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Loader2, MapPin, Package, CreditCard, Truck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, buildWhatsAppOrderMessage, ADMIN_WHATSAPP } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

type DeliveryType = "delivery" | "pickup";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("bank_transfer");

  // Fetch bank accounts from settings
  const { data: bankAccountsRaw } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "bank_accounts")
        .maybeSingle();
      if (!data?.value) return [];
      try { return JSON.parse(data.value) as BankAccount[]; } catch { return []; }
    },
  });
  const bankAccounts: BankAccount[] = bankAccountsRaw ?? [];

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { toast.error("Your cart is empty"); return; }
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (deliveryType === "delivery" && !form.address.trim()) {
      toast.error("Please enter your delivery address");
      return;
    }

    setLoading(true);

    const fullAddress = deliveryType === "pickup"
      ? "PICKUP"
      : [form.address.trim(), form.city.trim(), form.state.trim()].filter(Boolean).join(", ");

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_address: fullAddress,
        delivery_notes: [
          form.email ? `Email: ${form.email.trim()}` : "",
          deliveryType === "pickup" ? "PICKUP ORDER" : "",
          form.notes.trim(),
        ].filter(Boolean).join(" | ") || null,
        amount_paid: total,
        paystack_reference: `${selectedPayment.toUpperCase()}-${Date.now()}`,
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error("Failed to place order. Please try again.");
      setLoading(false);
      return;
    }

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

    // WhatsApp notification
    const waItems = items.map((i) => ({
      title: i.title,
      variant: i.variantLabel,
      qty: i.quantity,
      price: i.price * i.quantity,
    }));
    const waMsg = buildWhatsAppOrderMessage(
      order.id, form.name, form.phone, fullAddress,
      waItems, total, deliveryType, form.email
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
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Continue Shopping
        </Link>

        <h1 className="font-heading text-4xl font-light mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* ── Form ── */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-3 space-y-5">

            {/* Customer Details */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-heading text-xl font-medium mb-5">Customer Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
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
                    <label className="block text-sm font-medium mb-1.5">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+234..."
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Email Address <span className="text-foreground/30 text-xs font-normal">(for receipt)</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-heading text-xl font-medium mb-5">Delivery Method</h2>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setDeliveryType("delivery")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    deliveryType === "delivery"
                      ? "border-brand-blue-deep bg-brand-blue/10"
                      : "border-border hover:border-brand-blue/40"
                  }`}
                >
                  <Truck size={22} className={deliveryType === "delivery" ? "text-brand-blue-deep" : "text-foreground/40"} />
                  <span className={`text-sm font-medium ${deliveryType === "delivery" ? "text-brand-blue-deep" : "text-foreground/60"}`}>
                    Home Delivery
                  </span>
                  <span className="text-xs text-foreground/40">We bring it to you</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType("pickup")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    deliveryType === "pickup"
                      ? "border-brand-blue-deep bg-brand-blue/10"
                      : "border-border hover:border-brand-blue/40"
                  }`}
                >
                  <MapPin size={22} className={deliveryType === "pickup" ? "text-brand-blue-deep" : "text-foreground/40"} />
                  <span className={`text-sm font-medium ${deliveryType === "pickup" ? "text-brand-blue-deep" : "text-foreground/60"}`}>
                    Pickup
                  </span>
                  <span className="text-xs text-foreground/40">Collect from us</span>
                </button>
              </div>

              {deliveryType === "delivery" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Street Address <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="House number, street name..."
                      required={deliveryType === "delivery"}
                      rows={2}
                      className="input-field resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">City</label>
                      <input
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Lagos"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">State</label>
                      <input
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        placeholder="Lagos State"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              {deliveryType === "pickup" && (
                <div className="p-4 bg-brand-blue/10 rounded-xl border border-brand-blue/20 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-brand-blue-deep mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-brand-blue-deep mb-1">Pickup Selected</p>
                      <p className="text-foreground/60">
                        We'll contact you on WhatsApp with the pickup location and time after your order is placed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1.5">
                  Special Instructions <span className="text-foreground/30 text-xs font-normal">(optional)</span>
                </label>
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Colour preference, gift wrapping, etc."
                  className="input-field"
                />
              </div>
            </div>

            {/* Payment */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-heading text-xl font-medium mb-5">Payment Method</h2>

              <div className="space-y-3 mb-4">
                {/* Bank Transfer option */}
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPayment === "bank_transfer"
                    ? "border-brand-blue-deep bg-brand-blue/10"
                    : "border-border hover:border-brand-blue/30"
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="bank_transfer"
                    checked={selectedPayment === "bank_transfer"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={16} className="text-brand-blue-deep" />
                      <span className="font-medium text-sm">Bank Transfer</span>
                    </div>
                    <p className="text-xs text-foreground/50">Transfer to our account — send proof on WhatsApp</p>

                    {/* Bank account details */}
                    {selectedPayment === "bank_transfer" && bankAccounts.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {bankAccounts.map((acc, i) => (
                          <div key={i} className="bg-white rounded-lg p-3 border border-brand-blue/20 text-xs">
                            <p className="font-semibold text-brand-blue-deep">{acc.bankName}</p>
                            <p className="font-mono text-base font-bold tracking-widest mt-1">{acc.accountNumber}</p>
                            <p className="text-foreground/60 mt-0.5">{acc.accountName}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedPayment === "bank_transfer" && bankAccounts.length === 0 && (
                      <p className="mt-2 text-xs text-foreground/40 italic">
                        Bank details will be sent via WhatsApp after placing order.
                      </p>
                    )}
                  </div>
                </label>

                {/* Pay on Delivery */}
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedPayment === "pay_on_delivery"
                    ? "border-brand-blue-deep bg-brand-blue/10"
                    : "border-border hover:border-brand-blue/30"
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="pay_on_delivery"
                    checked={selectedPayment === "pay_on_delivery"}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package size={16} className="text-brand-blue-deep" />
                      <span className="font-medium text-sm">Pay on Delivery</span>
                    </div>
                    <p className="text-xs text-foreground/50">
                      {deliveryType === "pickup" ? "Pay when you collect your order" : "Pay cash when your order arrives"}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base py-4"
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Placing Order...</>
              ) : (
                `Place Order — ${formatPrice(total)}`
              )}
            </button>

            <p className="text-xs text-center text-foreground/40">
              By placing your order you'll receive a WhatsApp message to confirm delivery details.
            </p>
          </form>

          {/* ── Order Summary ── */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h2 className="font-heading text-xl font-medium mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5 max-h-72 overflow-y-auto">
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
                      {item.variantLabel && (
                        <p className="text-xs text-foreground/40">{item.variantLabel}</p>
                      )}
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
                  <span className={deliveryType === "pickup" ? "text-green-500" : "text-foreground/50"}>
                    {deliveryType === "pickup" ? "Free (Pickup)" : "Arranged via WhatsApp"}
                  </span>
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

interface BankAccount {
  bankName: string;
  accountName: string;
  accountNumber: string;
}
