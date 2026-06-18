import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const minPrice = product.has_variants && product.product_variants?.length
    ? Math.min(...product.product_variants.map((v) => v.price))
    : product.base_price;

  const maxPrice = product.has_variants && product.product_variants?.length
    ? Math.max(...product.product_variants.map((v) => v.price))
    : product.base_price;

  const priceDisplay =
    minPrice === null ? "Price on request"
    : minPrice === maxPrice ? formatPrice(minPrice)
    : `From ${formatPrice(minPrice)}`;

  return (
    <Link to={`/products/${product.id}`} className="product-card group block">
      {/* Image */}
      <div className="aspect-[4/5] bg-surface-2 overflow-hidden relative">
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
        {product.has_variants && (
          <span className="absolute top-3 left-3 tag-pill text-[11px]">Variants</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {product.categories && (
          <p className="text-xs text-foreground/40 uppercase tracking-wider mb-1">
            {product.categories.name}
          </p>
        )}
        <h3 className="font-heading text-lg font-light leading-tight text-foreground line-clamp-2">
          {product.title}
        </h3>
        <p className="text-sm font-medium text-brand-blue-deep mt-2">{priceDisplay}</p>
      </div>
    </Link>
  );
}
