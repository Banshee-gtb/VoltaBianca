import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, ShoppingBag, Plus, Minus, Check, ChevronLeft, ChevronRight,
  AlertCircle, X, ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/contexts/CartContext";
import { formatPrice, buildVariantLabel } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// ── Lightbox ──────────────────────────────────────────────────────────────
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => setCurrent((i) => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() => setCurrent((i) => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-60 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40 transition-colors"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/60 bg-black/40 px-3 py-1 rounded-full">
        {current + 1} / {images.length}
      </div>

      {/* Image */}
      <div
        className="relative max-w-4xl max-h-[85vh] w-full mx-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[current]}
          alt={`Image ${current + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                i === current ? "border-white" : "border-white/30 opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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

  // Full image list: main + gallery
  const allImages: string[] = [];
  if (product.main_image_url) allImages.push(product.main_image_url);
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img: string) => {
      if (img && img !== product.main_image_url) allImages.push(img);
    });
  }

  const uniqueColors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];
  const uniqueSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];

  function findVariant(color: string | null, size: string | null): ProductVariant | null {
    if (uniqueColors.length > 0 && uniqueSizes.length > 0) {
      return variants.find((v) => v.color === color && v.size === size) ?? null;
    }
    if (uniqueColors.length > 0) return variants.find((v) => v.color === color) ?? null;
    if (uniqueSizes.length > 0) return variants.find((v) => v.size === size) ?? null;
    return variants[0] ?? null;
  }

  function isColorInStock(color: string): boolean {
    return variants.some((v) => v.color === color && v.stock > 0);
  }
  function isSizeInStock(size: string): boolean {
    if (selectedColor) {
      const v = variants.find((vr) => vr.color === selectedColor && vr.size === size);
      return v ? v.stock > 0 : false;
    }
    return variants.some((v) => v.size === size && v.stock > 0);
  }

  const displayPrice = product.has_variants
    ? selectedVariant
      ? formatPrice(selectedVariant.price)
      : variants.length
        ? `From ${formatPrice(Math.min(...variants.map((v) => v.price)))}`
        : "Price on request"
    : product.base_price != null
      ? formatPrice(product.base_price)
      : "Price on request";

  const currentStock = selectedVariant ? selectedVariant.stock : null;
  const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 : false;
  const isLowStock = selectedVariant ? selectedVariant.stock > 0 && selectedVariant.stock <= 5 : false;

  function handleAddToCart() {
    if (product!.has_variants && !selectedVariant) {
      toast.error("Please select all options first");
      return;
    }
    if (isOutOfStock) {
      toast.error("This item is out of stock");
      return;
    }
    const price = product!.has_variants ? selectedVariant!.price : product!.base_price!;
    addItem({
      productId: product!.id,
      variantId: selectedVariant?.id ?? null,
      title: product!.title,
      variantLabel: selectedVariant ? buildVariantLabel(selectedVariant.color, selectedVariant.size) : null,
      price,
      quantity: qty,
      imageUrl: allImages[0] ?? null,
    });
    setAdded(true);
    toast.success("Added to bag!");
    setTimeout(() => setAdded(false), 2000);
  }

  function prevImage() {
    setActiveImageIndex((i) => (i === 0 ? allImages.length - 1 : i - 1));
  }
  function nextImage() {
    setActiveImageIndex((i) => (i === allImages.length - 1 ? 0 : i + 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only swipe if horizontal movement is dominant and at least 50px
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && allImages.length > 1) {
      if (dx < 0) nextImage();
      else prevImage();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  const canAddToCart = !isOutOfStock && (!product.has_variants || !!selectedVariant);

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* ── Image Gallery ── */}
          <div className="space-y-3">
            {/* Main image */}
            <div
              className="relative aspect-[4/5] bg-surface-2 rounded-3xl overflow-hidden group cursor-zoom-in"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {allImages.length > 0 ? (
                <img
                  key={activeImageIndex}
                  src={allImages[activeImageIndex]}
                  alt={`${product.title} ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  onClick={() => setLightboxOpen(true)}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag size={64} className="text-foreground/10" strokeWidth={1} />
                </div>
              )}

              {/* Zoom hint */}
              {allImages.length > 0 && (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white hover:text-foreground"
                >
                  <ZoomIn size={16} />
                </button>
              )}

              {/* Nav arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                  {/* Dot indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        className={`rounded-full transition-all duration-200 ${
                          i === activeImageIndex ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Image count badge */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {activeImageIndex + 1}/{allImages.length}
                </div>
              )}
            </div>

            {/* Scrollable Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      i === activeImageIndex
                        ? "border-brand-blue-deep scale-105 shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100 hover:border-brand-blue/40"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {allImages.length > 0 && (
              <p className="text-xs text-foreground/40 text-center">
                Tap image to zoom • {allImages.length} photo{allImages.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="flex flex-col py-2">
            {product.categories && (
              <span className="text-xs text-foreground/40 uppercase tracking-wider mb-3">
                {product.categories.name}
              </span>
            )}

            <h1 className="font-heading text-3xl sm:text-4xl font-light leading-tight mb-4">
              {product.title}
            </h1>

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
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-heading text-3xl font-medium text-brand-blue-deep">
                {displayPrice}
              </span>
              {product.shipping_fee != null && product.shipping_fee > 0 && (
                <span className="text-sm text-foreground/40">
                  + {formatPrice(product.shipping_fee)} shipping
                </span>
              )}
            </div>

            {/* Stock indicator */}
            {currentStock !== null && (
              <div
                className={`flex items-center gap-2 text-sm mb-5 ${
                  isOutOfStock ? "text-red-500" : isLowStock ? "text-orange-500" : "text-green-600"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOutOfStock ? "bg-red-400" : isLowStock ? "bg-orange-400" : "bg-green-400"
                  }`}
                />
                {isOutOfStock
                  ? "Out of stock"
                  : isLowStock
                    ? `Only ${currentStock} left in stock`
                    : "In stock"}
              </div>
            )}

            {/* Color selector */}
            {uniqueColors.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium mb-3">
                  Colour:{" "}
                  <span className="text-foreground/50 font-normal">{selectedColor ?? "Select a colour"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => {
                    const inStock = isColorInStock(color);
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          setSelectedVariant(findVariant(color, selectedSize));
                        }}
                        disabled={!inStock}
                        className={`relative px-4 py-2 rounded-full border text-sm transition-all duration-200 min-h-[44px] ${
                          isSelected
                            ? "border-brand-blue-deep bg-brand-blue/10 text-brand-blue-deep font-medium"
                            : inStock
                              ? "border-border hover:border-brand-blue/50 text-foreground"
                              : "border-border/40 text-foreground/30 line-through cursor-not-allowed"
                        }`}
                      >
                        {color}
                        {!inStock && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 border-2 border-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size selector */}
            {uniqueSizes.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-3">
                  Size:{" "}
                  <span className="text-foreground/50 font-normal">{selectedSize ?? "Select a size"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueSizes.map((size) => {
                    const inStock = isSizeInStock(size);
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSize(size);
                          setSelectedVariant(findVariant(selectedColor, size));
                        }}
                        disabled={!inStock}
                        className={`relative px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 min-h-[44px] min-w-[52px] ${
                          isSelected
                            ? "border-brand-blue-deep bg-brand-blue/10 text-brand-blue-deep"
                            : inStock
                              ? "border-border hover:border-brand-blue/50 text-foreground"
                              : "border-border/40 text-foreground/30 cursor-not-allowed bg-surface-2"
                        }`}
                      >
                        {size}
                        {!inStock && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="absolute w-full h-px bg-foreground/20 rotate-[-25deg]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-foreground/40 mt-2">
                  <AlertCircle size={11} className="inline mr-1" />
                  Crossed out sizes are currently out of stock
                </p>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-8">
              <p className="text-sm font-medium">Quantity:</p>
              <div className="flex items-center gap-3 border border-border rounded-full px-4 py-2 bg-white">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-7 h-7 flex items-center justify-center hover:text-brand-blue-deep transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-medium w-6 text-center">{qty}</span>
                <button
                  onClick={() => {
                    const max = currentStock ?? 99;
                    setQty(Math.min(qty + 1, max > 0 ? max : 99));
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:text-brand-blue-deep transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              {currentStock !== null && currentStock > 0 && (
                <span className="text-xs text-foreground/40">(max {currentStock})</span>
              )}
            </div>

            {/* Desktop Add to Cart */}
            <div className="hidden lg:block">
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className={`btn-primary text-base py-4 w-full transition-all duration-300 ${
                  added ? "!bg-green-500" : isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {added ? (
                  <><Check size={20} /> Added to Bag</>
                ) : isOutOfStock ? (
                  "Out of Stock"
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    Add to Bag
                    {selectedVariant
                      ? ` — ${formatPrice(selectedVariant.price * qty)}`
                      : product.base_price
                        ? ` — ${formatPrice(product.base_price * qty)}`
                        : ""}
                  </>
                )}
              </button>
              {product.has_variants && !selectedVariant && (
                <p className="text-xs text-foreground/40 text-center mt-2">
                  Select all options above to add to bag
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* ── Sticky Mobile Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{product.title}</p>
            <p className="text-brand-blue-deep font-heading text-base font-medium">
              {selectedVariant
                ? formatPrice(selectedVariant.price * qty)
                : product.base_price
                  ? formatPrice(product.base_price * qty)
                  : displayPrice}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={`btn-primary px-6 py-3 flex-shrink-0 transition-all duration-300 ${
              added ? "!bg-green-500" : isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {added ? (
              <><Check size={18} /> Added</>
            ) : isOutOfStock ? (
              "Out of Stock"
            ) : (
              <><ShoppingBag size={18} /> Add to Bag</>
            )}
          </button>
        </div>
        {product.has_variants && !selectedVariant && (
          <p className="text-xs text-center text-foreground/40 mt-1">Select options above</p>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && allImages.length > 0 && (
        <Lightbox
          images={allImages}
          startIndex={activeImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
