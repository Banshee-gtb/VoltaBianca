import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/types";
import ProductCard from "@/components/features/ProductCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Verified high-quality Unsplash images for the hero slideshow
const HERO_SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1541643600914-78b084683702?w=1600&h=1000&fit=crop&q=90",
    label: "Luxury Fragrances",
  },
  {
    url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=1000&fit=crop&q=90",
    label: "Premium Fashion",
  },
  {
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&h=1000&fit=crop&q=90",
    label: "Human Hair & Beauty",
  },
  {
    url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&h=1000&fit=crop&q=90",
    label: "Designer Clothing",
  },
  {
    url: "https://images.unsplash.com/photo-1596704017248-1fef7e849cc5?w=1600&h=1000&fit=crop&q=90",
    label: "Beauty & Skincare",
  },
];

function HeroSlideshow() {
  const [active, setActive] = useState(0);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Slides — fade in/out with pure opacity transition */}
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.url}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <img
            src={slide.url}
            alt={slide.label}
            className="w-full h-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Layered blur + gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-surface-1/95 via-surface-1/65 to-surface-1/25 backdrop-blur-[1px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-1/70" />

      {/* Dot navigation only — no arrows */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
        <span className="text-xs text-foreground/60 tracking-widest uppercase bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
          {HERO_SLIDES[active].label}
        </span>
        <div className="flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all duration-400 ${
                i === active
                  ? "w-7 h-2.5 bg-brand-blue-deep"
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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

      {/* ── Hero with Image Slideshow ── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        <HeroSlideshow />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full py-24">
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
              Discover handpicked pieces designed to elevate your everyday — from timeless fashion
              to luxe beauty essentials and premium hair collections.
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

            {/* Trust pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              {["Free Consultation", "Fast Delivery", "Quality Guaranteed"].map((t) => (
                <span
                  key={t}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 text-foreground/70"
                >
                  ✓ {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
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

      {/* ── Featured Products ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="section-title">New Arrivals</h2>
          <Link
            to="/products"
            className="text-sm text-brand-blue-deep hover:text-brand-purple-deep transition-colors flex items-center gap-1"
          >
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
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-gradient-to-r from-brand-blue/20 to-brand-purple/20 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-light mb-4">
            Need help finding something?
          </h2>
          <p className="text-foreground/60 mb-8">
            Chat with us directly on WhatsApp — we respond fast.
          </p>
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
