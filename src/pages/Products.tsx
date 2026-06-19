import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/types";
import ProductCard from "@/components/features/ProductCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") ?? "");
  const [selectedCat, setSelectedCat] = useState(searchParams.get("cat") ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tag = searchParams.get("tag");
    return tag ? [tag] : [];
  });

  // Sync from URL params on mount
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const cat = searchParams.get("cat") ?? "";
    setSearchInput(q);
    setDebouncedSearch(q);
    setSelectedCat(cat);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search input — real-time with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync state to URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
    if (selectedCat) params.cat = selectedCat;
    if (selectedTags.length === 1) params.tag = selectedTags[0];
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedCat, selectedTags]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return (data ?? []) as Category[];
    },
  });

  // Fetch all active products — filtering done client-side for real-time feel
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["products-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(*), product_variants(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      return (data ?? []) as Product[];
    },
    staleTime: 30_000,
  });

  // Collect all unique tags across products
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    allProducts.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [allProducts]);

  // Client-side filtering — real-time as inputs change
  const products = useMemo(() => {
    let results = allProducts;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCat) {
      results = results.filter((p) => p.categories?.id === selectedCat || p.categories?.name === selectedCat);
    }

    if (selectedTags.length > 0) {
      results = results.filter((p) => selectedTags.every((tag) => p.tags?.includes(tag)));
    }

    return results;
  }, [allProducts, debouncedSearch, selectedCat, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function clearAll() {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCat("");
    setSelectedTags([]);
    setSearchParams({}, { replace: true });
  }

  const hasFilters = debouncedSearch.trim() || selectedCat || selectedTags.length > 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <h1 className="font-heading text-4xl sm:text-5xl font-light mb-2">Shop All</h1>
        <p className="text-foreground/50 text-sm">
          {isLoading ? "Loading..." : `${products.length} ${products.length === 1 ? "product" : "products"}${selectedCat ? ` in ${categories.find(c => c.id === selectedCat || c.name === selectedCat)?.name ?? selectedCat}` : ""}`}
        </p>
      </div>

      {/* ── Search Bar (real-time, no submit) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products, tags, descriptions..."
            className="input-field pl-10 pr-10"
            autoComplete="off"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-foreground/40 font-medium uppercase tracking-wide flex-shrink-0">
            <SlidersHorizontal size={12} className="inline mr-1" />
            Category
          </span>
          <button
            onClick={() => setSelectedCat("")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
              !selectedCat
                ? "bg-brand-blue-deep text-white border-brand-blue-deep"
                : "border-border hover:border-brand-blue/50 text-foreground/70 hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(selectedCat === cat.id || selectedCat === cat.name ? "" : cat.name)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                selectedCat === cat.id || selectedCat === cat.name
                  ? "bg-brand-blue-deep text-white border-brand-blue-deep"
                  : "border-border hover:border-brand-blue/50 text-foreground/70 hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tag Filter Chips ── */}
      {allTags.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-foreground/40 font-medium uppercase tracking-wide flex-shrink-0">Tags</span>
            {allTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                    isSelected
                      ? "bg-brand-purple-deep text-white border-brand-purple-deep"
                      : "bg-brand-blue/10 text-brand-blue-deep border-brand-blue/30 hover:border-brand-blue-deep"
                  }`}
                >
                  {isSelected && <X size={10} className="inline mr-0.5" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active Filter Summary ── */}
      {hasFilters && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-foreground/40">Showing filtered results:</span>
          {debouncedSearch && (
            <span className="tag-pill flex items-center gap-1.5 text-xs">
              "{debouncedSearch}"
              <button onClick={() => setSearchInput("")} className="hover:text-red-400 transition-colors"><X size={11} /></button>
            </span>
          )}
          {selectedCat && (
            <span className="tag-pill flex items-center gap-1.5 text-xs">
              {categories.find(c => c.id === selectedCat || c.name === selectedCat)?.name ?? selectedCat}
              <button onClick={() => setSelectedCat("")} className="hover:text-red-400 transition-colors"><X size={11} /></button>
            </span>
          )}
          {selectedTags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-brand-purple/20 text-brand-purple-deep border border-brand-purple/30">
              {tag}
              <button onClick={() => toggleTag(tag)} className="hover:text-red-400 transition-colors"><X size={11} /></button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs text-foreground/40 hover:text-foreground underline transition-colors">
            Clear all
          </button>
        </div>
      )}

      {/* ── Products Grid ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-surface-2 animate-pulse aspect-[4/5]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <Search size={48} className="mx-auto text-foreground/15 mb-4" strokeWidth={1} />
            <p className="font-heading text-2xl font-light text-foreground/40 mb-2">No products found</p>
            <p className="text-sm text-foreground/30">Try adjusting your search or filters</p>
            {hasFilters && (
              <button onClick={clearAll} className="btn-secondary mt-6 text-sm">Clear all filters</button>
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
