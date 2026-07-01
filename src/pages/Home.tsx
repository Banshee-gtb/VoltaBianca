import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/types";
import ProductCard from "@/components/features/ProductCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function Home() {
  const { data: products = [] } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(*), product_variants(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8);
      return (data ?? []) as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return (data ?? []) as Category[];
    },
  });

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero min-h-[90vh] flex items-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-purple/20 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={16} className="text-brand-purple-deep" />
              <span className="text-sm font-medium text-brand-purple-deep tracking-wider uppercase">
                Curated with elegance
              </span>
            </div>

            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-light leading-tight text-foreground mb-6">
              Fashion.{" "}
              <span className="text-brand-blue-deep">Beauty.</span>
              <br />
              <span className="italic font-light">Lifestyle.</span>
            </h1>

            <p className="text-lg text-foreground/60 leading-relaxed max-w-lg mb-10">
              Discover handpicked pieces designed to elevate your everyday — from timeless fashion to luxe beauty essentials.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary text-base px-8 py-4">
                Shop Now <ArrowRight size={18} />
              </Link>
              <a
                href="https://wa.me/2349132996389"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-base px-8 py-4"
              >
                Chat With Us
              </a>
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-2/5 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&fit=crop&q=80"
            alt="MiMis Fashion Hub"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-1/90 via-surface-1/20 to-transparent" />
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="section-title mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?cat=${encodeURIComponent(cat.name)}`}
                className="group relative rounded-2xl overflow-hidden bg-gradient-card border border-border/50 p-6 min-h-[120px] flex items-end hover:border-brand-blue/40 hover:shadow-md transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-brand-purple/10 group-hover:opacity-100 opacity-0 transition-opacity" />
                <span className="font-heading text-lg font-light relative z-10">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">New Arrivals</h2>
          <Link to="/products" className="text-sm text-brand-blue-deep hover:text-brand-purple-deep transition-colors flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-foreground/40">
            <p className="font-heading text-2xl font-light mb-2">Coming soon</p>
            <p className="text-sm">Products are being added to the store.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-brand-blue/20 to-brand-purple/20 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-light mb-4">
            Need help finding something?
          </h2>
          <p className="text-foreground/60 mb-8">Chat with us directly on WhatsApp — we respond fast.</p>
          <a
            href="https://wa.me/2349132996389"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex"
          >
            Chat on WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
