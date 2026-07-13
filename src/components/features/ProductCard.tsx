import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/types";
import { formatPrice, buildVariantLabel } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";

interface Props {
  product: Product;
  featured?: boolean;
}

export default function ProductCard({ product, featured = false }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const variants = product.product_variants ?? [];

  const minPrice = product.has_variants && variants.length
    ? Math.min(...variants.map((v) => v.price))
    : product.base_price;

  const maxPrice = product.has_variants && variants.length
    ? Math.max(...variants.map((v) => v.price))
    : product.base_price;

  const priceDisplay =
    minPrice === null ? "Price on request"
    : minPrice === maxPrice ? formatPrice(minPrice)
    : `From ${formatPrice(minPrice!)}`;

  // Can quick-add only if: no variants OR exactly one variant
  const canQuickAdd = !product.has_variants || variants.length === 1;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (product.has_variants && variants.length > 1) {
      // Navigate to product page to choose variant — handled below
      return;
    }

    const variant = variants[0] ?? null;
    const price = variant ? variant.price : product.base_price;
    if (price == null) { toast.error("Price not available"); return; }

    if (variant && variant.stock <= 0) { toast.error("Out of stock"); return; }

    addItem({
      productId: product.id,
      variantId: variant?.id ?? null,
      title: product.title,
      variantLabel: variant ? buildVariantLabel(variant.color, variant.size) : null,
      price,
      quantity: 1,
      imageUrl: product.main_image_url ?? null,
    });

    setAdded(true);
    toast.success("Added to bag!");
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card group block relative"
    >
      {/* Image */}
      <div className={`bg-surface-2 overflow-hidden relative ${featured ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
        {product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={40} className="text-foreground/15" strokeWidth={1} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.has_variants && (
            <span className="tag-pill text-[11px]">Variants</span>
          )}
          {featured && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-yellow-400/90 text-yellow-900 backdrop-blur-sm shadow-sm">
              ✦ New Arrival
            </span>
          )}
        </div>

        {/* Quick-add / View button — bottom overlay on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          {canQuickAdd ? (
            <button
              onClick={handleAddToCart}
              aria-label="Add to cart"
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium shadow-lg transition-all duration-200 min-h-[44px]
                ${added
                  ? "bg-green-500 text-white"
                  : "bg-white/95 backdrop-blur-sm text-foreground hover:bg-brand-blue-deep hover:text-white"
                }`}
            >
              {added ? (
                <><Check size={16} /> Added to Bag</>
              ) : (
                <><ShoppingCart size={16} /> Add to Bag</>
              )}
            </button>
          ) : (
            <div
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium shadow-lg bg-white/95 backdrop-blur-sm text-foreground min-h-[44px]"
            >
              <ShoppingCart size={16} />
              Select Options
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        {product.categories && (
          <p className="text-[11px] text-foreground/40 uppercase tracking-wider mb-1">
            {product.categories.name}
          </p>
        )}
        <h3 className={`font-heading font-light leading-tight text-foreground line-clamp-2 ${featured ? "text-base sm:text-lg" : "text-sm sm:text-base"}`}>
          {product.title}
        </h3>
        <div className="flex items-center justify-between mt-2 gap-2">
          <p className="text-sm font-semibold text-brand-blue-deep">{priceDisplay}</p>
          {/* Mobile quick-add icon */}
          <button
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className={`flex-shrink-0 w-9 h-9 rounded-full border transition-all duration-200 flex items-center justify-center sm:hidden
              ${added
                ? "bg-green-500 border-green-500 text-white"
                : "border-border bg-white text-foreground/60 active:bg-brand-blue-deep active:text-white active:border-brand-blue-deep"
              }`}
          >
            {added ? <Check size={15} /> : <ShoppingCart size={15} />}
          </button>
        </div>
      </div>
    </Link>
  );
}
