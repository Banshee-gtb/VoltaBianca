import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Package, ShoppingCart, Tag, TrendingUp, Clock,
  Bell, BellOff, Download, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDateTime } from "@/lib/utils";
import type { Order } from "@/types";

// ── Notification tone via Web Audio API ───────────────────────────────────
function playOrderTone() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch {
    // Audio not available
  }
}

// ── PWA Install Hook ───────────────────────────────────────────────────────
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferredPrompt(null);
      toast.success("App installed! You can now launch MiMis Admin from your home screen.");
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    }
  }

  return { canInstall: !!deferredPrompt && !installed, installed, install };
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="font-heading text-3xl font-medium mb-1">{value}</p>
      <p className="text-sm text-foreground/50">{label}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  paid: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-500",
};

// ── Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const qc = useQueryClient();
  const isFirstRender = useRef(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const { canInstall, installed, install } = usePWAInstall();

  // ── Stats ──
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, categories] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, amount_paid, status"),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);
      const orderRows = orders.data ?? [];
      const revenue = orderRows
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.amount_paid ?? 0), 0);
      return {
        products: products.count ?? 0,
        orders: orderRows.length,
        revenue,
        categories: categories.count ?? 0,
      };
    },
  });

  // ── Recent Orders ──
  const { data: recentOrders = [] } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      return (data ?? []) as Order[];
    },
  });

  // ── Real-time Order Subscription ──
  useEffect(() => {
    const channel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          if (isFirstRender.current) return;

          const order = payload.new as Order;
          playOrderTone();

          // Browser notification if allowed
          if (Notification.permission === "granted") {
            new Notification("🛍️ New Order — MiMis Fashion Hub", {
              body: `${order.customer_name} placed an order for ${formatPrice(order.amount_paid)}`,
              icon: "/mh-logo.png",
              tag: "new-order",
            });
          }

          toast.success(
            `🛍️ New order from ${order.customer_name}! (${formatPrice(order.amount_paid)})`,
            { duration: 8000 }
          );

          qc.invalidateQueries({ queryKey: ["admin-recent-orders"] });
          qc.invalidateQueries({ queryKey: ["admin-stats"] });
        }
      )
      .subscribe();

    // Mark first render as done after a short delay
    const t = setTimeout(() => { isFirstRender.current = false; }, 2000);

    return () => {
      clearTimeout(t);
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // ── Request notification permission ──
  async function requestNotifPermission() {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported in this browser");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotifEnabled(true);
      toast.success("Notifications enabled! You'll be alerted for new orders.");
      new Notification("✅ Notifications Active", {
        body: "You'll receive alerts when new orders come in.",
        icon: "/mh-logo.png",
      });
    } else {
      toast.error("Notification permission denied. Enable it in your browser settings.");
    }
  }

  useEffect(() => {
    setNotifEnabled(Notification.permission === "granted");
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-light">Dashboard</h1>
          <p className="text-foreground/50 text-sm mt-1">Welcome back — here's your store overview.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Notification Toggle */}
          <button
            onClick={notifEnabled ? undefined : requestNotifPermission}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border transition-all duration-200 ${
              notifEnabled
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-surface-2 text-foreground/60 border-border hover:border-brand-blue/40 hover:text-foreground"
            }`}
            title={notifEnabled ? "Notifications active" : "Enable order notifications"}
          >
            {notifEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            <span className="hidden sm:inline">{notifEnabled ? "Notifications On" : "Enable Alerts"}</span>
          </button>

          {/* PWA Install Button */}
          {canInstall && (
            <button
              onClick={install}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-brand-blue-deep text-white border border-brand-blue-deep hover:bg-brand-purple-deep transition-all duration-200"
            >
              <Download size={16} />
              <span>Install App</span>
            </button>
          )}
          {installed && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
              <CheckCircle2 size={14} /> App Installed
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Products" value={stats?.products ?? 0} icon={Package} color="bg-brand-blue-deep" />
        <StatCard label="Total Orders" value={stats?.orders ?? 0} icon={ShoppingCart} color="bg-brand-purple-deep" />
        <StatCard label="Revenue" value={formatPrice(stats?.revenue ?? 0)} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard label="Categories" value={stats?.categories ?? 0} icon={Tag} color="bg-orange-400" />
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-foreground/40">Live — orders appear here in real-time</span>
      </div>

      {/* Recent Orders */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-brand-blue-deep" />
            <h2 className="font-heading text-xl font-medium">Recent Orders</h2>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs text-brand-blue-deep hover:text-brand-purple-deep transition-colors"
          >
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-foreground/40 text-sm text-center py-8">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-foreground/50 font-medium">Order</th>
                  <th className="text-left py-3 pr-4 text-foreground/50 font-medium">Customer</th>
                  <th className="text-left py-3 pr-4 text-foreground/50 font-medium hidden sm:table-cell">Date</th>
                  <th className="text-left py-3 pr-4 text-foreground/50 font-medium">Amount</th>
                  <th className="text-left py-3 text-foreground/50 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-surface-1/50 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-foreground/50">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 pr-4 font-medium">{order.customer_name}</td>
                    <td className="py-3 pr-4 text-foreground/50 hidden sm:table-cell">{formatDateTime(order.created_at)}</td>
                    <td className="py-3 pr-4 font-medium text-brand-blue-deep">{formatPrice(order.amount_paid)}</td>
                    <td className="py-3">
                      <span className={`status-badge ${STATUS_COLORS[order.status] ?? "bg-surface-2"}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
