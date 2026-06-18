import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingBag, Plus, Minus, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, buildVariantLabel } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(*), product_variants(*)")
        .eq("id", id!)
        .eq("is_active", true)
        .maybeSingle();
      return data as Product | null;
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-blue-deep border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="font-heading text-2xl font-light text-foreground/50 mb-4">Product not found</p>
        <Link to="/products" className="btn-secondary">Back to Shop</Link>
      </div>
    </div>
  );

  const variants = product.product_variants ?? [];
  const uniqueColors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];
  const uniqueSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];

  const displayPrice = product.has_variants
    ? selectedVariant
      ? formatPrice(selectedVariant.price)
      : variants.length
        ? `From ${formatPrice(Math.min(...variants.map((v) => v.price)))}`
        : "Price on request"
    : product.base_price != null
      ? formatPrice(product.base_price)
      : "Price on request";

  function handleAddToCart() {
    if (product!.has_variants && !selectedVariant) {
      toast.error("Please select a variant first");
      return;
    }

    const price = product!.has_variants
      ? selectedVariant!.price
      : product!.base_price!;

    addItem({
      productId: product!.id,
      variantId: selectedVariant?.id ?? null,
      title: product!.title,
      variantLabel: selectedVariant
        ? buildVariantLabel(selectedVariant.color, selectedVariant.size)
        : null,
      price,
      quantity: qty,
      imageUrl: product!.main_image_url,
    });

    setAdded(true);
    toast.success("Added to bag!");
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image */}
          <div className="aspect-[4/5] bg-surface-2 rounded-3xl overflow-hidden">
            {product.main_image_url ? (
              <img
                src={product.main_image_url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag size={64} className="text-foreground/10" strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col py-2">
            {product.categories && (
              <span className="text-xs text-foreground/40 uppercase tracking-wider mb-3">
                {product.categories.name}
              </span>
            )}

            <h1 className="font-heading text-3xl sm:text-4xl font-light leading-tight mb-4">
              {product.title}
            </h1>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.tags.map((tag) => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
            )}

            {product.description && (
              <p className="text-foreground/60 leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-heading text-3xl font-medium text-brand-blue-deep">
                {displayPrice}
              </span>
            </div>

            {/* Color selector */}
            {uniqueColors.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium mb-3">
                  Color: <span className="text-foreground/50">{selectedVariant?.color ?? "Select"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        const v = variants.find(
                          (vr) => vr.color === color && (selectedVariant?.size ? vr.size === selectedVariant.size : true)
                        );
                        setSelectedVariant(v ?? variants.find((vr) => vr.color === color) ?? null);
                      }}
                      className={`px-4 py-2 rounded-full border text-sm transition-all duration-200 min-h-[44px] ${
                        selectedVariant?.color === color
                          ? "border-brand-blue-deep bg-brand-blue/10 text-brand-blue-deep"
                          : "border-border hover:border-brand-blue/50"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {uniqueSizes.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-3">
                  Size: <span className="text-foreground/50">{selectedVariant?.size ?? "Select"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        const v = variants.find(
                          (vr) => vr.size === size && (selectedVariant?.color ? vr.color === selectedVariant.color : true)
                        );
                        setSelectedVariant(v ?? variants.find((vr) => vr.size === size) ?? null);
                      }}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 min-h-[44px] min-w-[52px] ${
                        selectedVariant?.size === size
                          ? "border-brand-blue-deep bg-brand-blue/10 text-brand-blue-deep"
                          : "border-border hover:border-brand-blue/50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-8">
              <p className="text-sm font-medium">Quantity:</p>
              <div className="flex items-center gap-3 border border-border rounded-full px-4 py-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-7 h-7 flex items-center justify-center hover:text-brand-blue-deep transition-colors">
                  <Minus size={14} />
                </button>
                <span className="text-sm font-medium w-6 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-7 h-7 flex items-center justify-center hover:text-brand-blue-deep transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              className={`btn-primary text-base py-4 w-full transition-all duration-300 ${added ? "bg-green-500 hover:bg-green-500" : ""}`}
            >
              {added ? (
                <><Check size={20} /> Added to Bag</>
              ) : (
                <><ShoppingBag size={20} /> Add to Bag</>
              )}
            </button>

            {product.has_variants && !selectedVariant && (
              <p className="text-xs text-foreground/40 text-center mt-2">Select options to add to bag</p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
