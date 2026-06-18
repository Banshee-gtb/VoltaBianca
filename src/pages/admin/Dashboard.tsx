import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, Users, Tag, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDateTime } from "@/lib/utils";
import type { Order } from "@/types";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
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

export default function Dashboard() {
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

  const { data: recentOrders = [] } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data ?? []) as Order[];
    },
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-light">Dashboard</h1>
        <p className="text-foreground/50 text-sm mt-1">Welcome back — here's your store overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Products" value={stats?.products ?? 0} icon={Package} color="bg-brand-blue-deep" />
        <StatCard label="Total Orders" value={stats?.orders ?? 0} icon={ShoppingCart} color="bg-brand-purple-deep" />
        <StatCard label="Revenue" value={formatPrice(stats?.revenue ?? 0)} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard label="Categories" value={stats?.categories ?? 0} icon={Tag} color="bg-orange-400" />
      </div>

      {/* Recent Orders */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Clock size={18} className="text-brand-blue-deep" />
          <h2 className="font-heading text-xl font-medium">Recent Orders</h2>
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
