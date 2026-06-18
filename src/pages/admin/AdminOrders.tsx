import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronDown, ChevronUp, MessageCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDateTime, buildWhatsAppOrderMessage, ADMIN_WHATSAPP } from "@/lib/utils";
import type { Order, OrderItem } from "@/types";

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  paid: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      return (data ?? []) as Order[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); },
    onError: () => toast.error("Failed to update status"),
  });

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openWhatsApp(order: Order) {
    const items = (order.order_items ?? []).map((i: OrderItem) => ({
      title: i.product_title,
      variant: i.variant_label,
      qty: i.quantity,
      price: i.price * i.quantity,
    }));
    const msg = buildWhatsAppOrderMessage(
      order.id, order.customer_name, order.customer_phone,
      order.customer_address, items, order.amount_paid
    );
    window.open(`https://wa.me/${order.customer_phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-light">Orders</h1>
        <p className="text-foreground/50 text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, order ID..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-44">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-surface-2 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-foreground/15 mb-4" strokeWidth={1} />
          <p className="font-heading text-xl font-light text-foreground/40">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="glass-card rounded-2xl overflow-hidden">
              {/* Order row */}
              <div
                className="flex flex-wrap items-center gap-3 p-4 cursor-pointer hover:bg-surface-1/60 transition-colors"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-foreground/40">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`status-badge border ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                  </div>
                  <p className="font-medium mt-0.5">{order.customer_name}</p>
                  <p className="text-xs text-foreground/40">{order.customer_phone} · {formatDateTime(order.created_at)}</p>
                </div>

                <div className="text-right">
                  <p className="font-heading text-lg font-medium text-brand-blue-deep">{formatPrice(order.amount_paid)}</p>
                  <p className="text-xs text-foreground/40">{order.order_items?.length ?? 0} items</p>
                </div>

                {expandedId === order.id ? <ChevronUp size={18} className="text-foreground/40" /> : <ChevronDown size={18} className="text-foreground/40" />}
              </div>

              {/* Expanded */}
              {expandedId === order.id && (
                <div className="border-t border-border p-4 bg-surface-1/50 space-y-4 animate-fade-in">
                  {/* Customer info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-foreground/40 text-xs mb-1">Address</p>
                      <p>{order.customer_address}</p>
                    </div>
                    {order.delivery_notes && (
                      <div>
                        <p className="text-foreground/40 text-xs mb-1">Notes</p>
                        <p>{order.delivery_notes}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-foreground/40 text-xs mb-1">Payment Ref</p>
                      <p className="font-mono text-xs">{order.paystack_reference ?? "—"}</p>
                    </div>
                  </div>

                  {/* Items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div>
                      <p className="text-xs text-foreground/40 mb-2">Order Items</p>
                      <div className="space-y-2">
                        {order.order_items.map((item: OrderItem) => (
                          <div key={item.id} className="flex justify-between text-sm bg-white rounded-lg px-3 py-2">
                            <span>{item.product_title}{item.variant_label ? ` — ${item.variant_label}` : ""} ×{item.quantity}</span>
                            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-foreground/50">Update status:</label>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                        className="input-field py-1.5 text-sm w-36"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                    <button onClick={() => openWhatsApp(order)} className="btn-secondary text-sm py-2 px-4 gap-2">
                      <MessageCircle size={15} /> WhatsApp Customer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
