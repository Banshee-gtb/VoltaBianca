import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/types";
import ProductCard from "@/components/features/ProductCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [selectedCat, setSelectedCat] = useState(searchParams.get("cat") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const cat = searchParams.get("cat") ?? "";
    setSearch(q);
    setSelectedCat(cat);
  }, [searchParams]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return (data ?? []) as Category[];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search, selectedCat],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(*), product_variants(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (search.trim()) {
        query = query.ilike("title", `%${search.trim()}%`);
      }

      const { data } = await query;
      let results = (data ?? []) as Product[];

      if (selectedCat) {
        results = results.filter((p) =>
          p.categories?.name?.toLowerCase().includes(selectedCat.toLowerCase())
        );
      }

      return results;
    },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (search.trim()) params.q = search.trim();
    if (selectedCat) params.cat = selectedCat;
    setSearchParams(params);
  }

  function clearFilters() {
    setSearch("");
    setSelectedCat("");
    setSearchParams({});
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <h1 className="font-heading text-4xl sm:text-5xl font-light mb-2">Shop All</h1>
        <p className="text-foreground/50 text-sm">
          {products.length} {products.length === 1 ? "product" : "products"}
          {selectedCat ? ` in ${selectedCat}` : ""}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary px-5">Search</button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary px-4 gap-2"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </form>

        {/* Category filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            <button
              onClick={() => { setSelectedCat(""); setSearchParams(search ? { q: search } : {}); }}
              className={`tag-pill cursor-pointer transition-all ${!selectedCat ? "bg-brand-blue text-white border-brand-blue" : ""}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCat(cat.name);
                  const params: Record<string, string> = { cat: cat.name };
                  if (search) params.q = search;
                  setSearchParams(params);
                }}
                className={`tag-pill cursor-pointer transition-all ${selectedCat === cat.name ? "bg-brand-blue-deep text-white border-brand-blue-deep" : ""}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Active filters */}
        {(search || selectedCat) && (
          <div className="flex items-center gap-3 mt-3">
            <span className="text-sm text-foreground/50">Active filters:</span>
            {search && <span className="tag-pill flex items-center gap-1">"{search}" <button onClick={() => { setSearch(""); setSearchParams(selectedCat ? { cat: selectedCat } : {}); }}><X size={12} /></button></span>}
            {selectedCat && <span className="tag-pill flex items-center gap-1">{selectedCat} <button onClick={() => { setSelectedCat(""); setSearchParams(search ? { q: search } : {}); }}><X size={12} /></button></span>}
            <button onClick={clearFilters} className="text-xs text-foreground/40 hover:text-foreground transition-colors underline">Clear all</button>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-surface-2 animate-pulse aspect-[4/5]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-heading text-2xl font-light text-foreground/40 mb-2">No products found</p>
            <p className="text-sm text-foreground/30">Try adjusting your search or filters</p>
            {(search || selectedCat) && (
              <button onClick={clearFilters} className="btn-secondary mt-6 text-sm">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
