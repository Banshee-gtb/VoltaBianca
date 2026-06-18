import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, Package, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export default function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(*), product_variants(*)")
        .order("created_at", { ascending: false });
      return (data ?? []) as Product[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
    onError: () => toast.error("Failed to update product"),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-light">Products</h1>
          <p className="text-foreground/50 text-sm mt-1">{products.length} total products</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="input-field pl-10"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-foreground/15 mb-4" strokeWidth={1} />
          <p className="font-heading text-xl font-light text-foreground/40 mb-2">No products yet</p>
          <Link to="/admin/products/new" className="btn-primary text-sm">Add your first product</Link>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-1">
                <tr>
                  <th className="text-left py-3 px-4 text-foreground/50 font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-foreground/50 font-medium hidden md:table-cell">Category</th>
                  <th className="text-left py-3 px-4 text-foreground/50 font-medium">Price</th>
                  <th className="text-left py-3 px-4 text-foreground/50 font-medium hidden sm:table-cell">Variants</th>
                  <th className="text-left py-3 px-4 text-foreground/50 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-foreground/50 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const minPrice = product.has_variants && product.product_variants?.length
                    ? Math.min(...product.product_variants.map((v) => v.price))
                    : product.base_price;

                  return (
                    <tr key={product.id} className="border-b border-border/40 hover:bg-surface-1/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-2 flex-shrink-0">
                            {product.main_image_url ? (
                              <img src={product.main_image_url} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={16} className="text-foreground/20" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium line-clamp-1">{product.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground/50 hidden md:table-cell">
                        {product.categories?.name ?? "—"}
                      </td>
                      <td className="py-3 px-4 font-medium text-brand-blue-deep">
                        {minPrice != null ? formatPrice(minPrice) : "—"}
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        {product.has_variants ? (
                          <span className="tag-pill">{product.product_variants?.length ?? 0} variants</span>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleActive.mutate({ id: product.id, is_active: !product.is_active })}
                          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${product.is_active ? "text-green-600" : "text-foreground/30"}`}
                        >
                          {product.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          <span className="hidden sm:inline">{product.is_active ? "Active" : "Hidden"}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/products/${product.id}/edit`} className="btn-ghost p-2 text-foreground/50">
                            <Edit2 size={15} />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm("Delete this product?")) deleteProduct.mutate(product.id);
                            }}
                            className="btn-ghost p-2 text-red-400 hover:text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
