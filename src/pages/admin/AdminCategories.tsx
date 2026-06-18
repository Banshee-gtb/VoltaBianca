import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Category } from "@/types";

export default function AdminCategories() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return (data ?? []) as Category[];
    },
  });

  const addCategory = useMutation({
    mutationFn: async (catName: string) => {
      const { error } = await supabase.from("categories").insert({ name: catName.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category added");
      setName("");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message.includes("unique") ? "Category already exists" : "Failed to add category"),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toast.error("Failed to delete category"),
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    await addCategory.mutateAsync(name);
    setAdding(false);
  }

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-light">Categories</h1>
        <p className="text-foreground/50 text-sm mt-1">Organise your products by category.</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="glass-card rounded-2xl p-6 mb-6">
        <h2 className="font-heading text-lg font-medium mb-4">Add New Category</h2>
        <div className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name..."
            className="input-field flex-1"
          />
          <button type="submit" disabled={adding || !name.trim()} className="btn-primary px-5">
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b border-border">
          <Tag size={18} className="text-brand-blue-deep" />
          <h2 className="font-heading text-lg font-medium">All Categories</h2>
          <span className="ml-auto text-sm text-foreground/40">{categories.length} total</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="p-8 text-center text-foreground/40 text-sm">No categories yet.</p>
        ) : (
          <div>
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 last:border-0 hover:bg-surface-1/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-blue-deep" />
                  <span className="font-medium">{cat.name}</span>
                </div>
                <button
                  onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteCategory.mutate(cat.id); }}
                  className="btn-ghost p-2 text-red-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
