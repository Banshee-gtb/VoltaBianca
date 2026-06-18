import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Upload, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { Category, ProductVariant } from "@/types";

interface VariantDraft {
  id?: string;
  color: string;
  size: string;
  price: string;
  stock: string;
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<VariantDraft[]>([
    { color: "", size: "", price: "", stock: "0" },
  ]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return (data ?? []) as Category[];
    },
  });

  useQuery({
    queryKey: ["admin-product-edit", id],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("id", id!)
        .single();
      if (data) {
        setTitle(data.title);
        setDescription(data.description ?? "");
        setCategoryId(data.category_id ?? "");
        setTags((data.tags ?? []).join(", "));
        setBasePrice(data.base_price?.toString() ?? "");
        setHasVariants(data.has_variants);
        setIsActive(data.is_active);
        setCurrentImageUrl(data.main_image_url);
        if (data.product_variants?.length) {
          setVariants(
            data.product_variants.map((v: ProductVariant) => ({
              id: v.id,
              color: v.color ?? "",
              size: v.size ?? "",
              price: v.price.toString(),
              stock: v.stock.toString(),
            }))
          );
        }
      }
      return data;
    },
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { color: "", size: "", price: "", stock: "0" }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof VariantDraft, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return currentImageUrl;
    const ext = imageFile.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, imageFile, { upsert: true });
    if (error) { toast.error("Image upload failed"); return currentImageUrl; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Product title is required"); return; }
    if (!hasVariants && !basePrice) { toast.error("Please enter a base price or enable variants"); return; }
    if (hasVariants && variants.some((v) => !v.price)) { toast.error("All variants need a price"); return; }
    setSubmitting(true);

    const imageUrl = await uploadImage();
    const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const productData = {
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      tags: tagArray,
      base_price: hasVariants ? null : parseFloat(basePrice) || null,
      has_variants: hasVariants,
      is_active: isActive,
      main_image_url: imageUrl,
    };

    let productId = id;

    if (isEdit) {
      const { error } = await supabase.from("products").update(productData).eq("id", id!);
      if (error) { toast.error("Failed to update product"); setSubmitting(false); return; }
    } else {
      const { data, error } = await supabase.from("products").insert(productData).select().single();
      if (error || !data) { toast.error("Failed to create product"); setSubmitting(false); return; }
      productId = data.id;
    }

    // Manage variants
    if (hasVariants && productId) {
      // Delete removed variants
      if (isEdit) {
        const existingIds = variants.filter((v) => v.id).map((v) => v.id!);
        await supabase.from("product_variants").delete().eq("product_id", productId).not("id", "in", `(${existingIds.join(",") || "null"})`);
      }

      for (const v of variants) {
        const vData = {
          product_id: productId,
          color: v.color.trim() || null,
          size: v.size.trim() || null,
          price: parseFloat(v.price),
          stock: parseInt(v.stock) || 0,
        };
        if (v.id) {
          await supabase.from("product_variants").update(vData).eq("id", v.id);
        } else {
          await supabase.from("product_variants").insert(vData);
        }
      }
    } else if (!hasVariants && isEdit) {
      await supabase.from("product_variants").delete().eq("product_id", productId!);
    }

    toast.success(isEdit ? "Product updated!" : "Product created!");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    navigate("/admin/products");
    setSubmitting(false);
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/products" className="btn-ghost p-2">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-light">{isEdit ? "Edit Product" : "New Product"}</h1>
          <p className="text-foreground/50 text-sm mt-0.5">{isEdit ? "Update product details" : "Add a new product to your store"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="font-heading text-lg font-medium">Product Details</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Product Title <span className="text-red-400">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input-field" placeholder="e.g. Silk Evening Dress" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input-field resize-none" placeholder="Product description..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field">
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tags <span className="text-foreground/30 text-xs">(comma separated)</span></label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} className="input-field" placeholder="summer, sale, new" />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${isActive ? "bg-brand-blue-deep" : "bg-border"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-medium">{isActive ? "Active (visible in store)" : "Hidden from store"}</span>
          </div>
        </div>

        {/* Image */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-heading text-lg font-medium mb-4">Main Image</h2>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-surface-2 flex-shrink-0">
              {imagePreview || currentImageUrl ? (
                <img src={imagePreview || currentImageUrl!} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={24} className="text-foreground/20" />
                </div>
              )}
            </div>
            <div>
              <label className="btn-secondary cursor-pointer text-sm">
                <Upload size={16} /> Upload Image
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              <p className="text-xs text-foreground/40 mt-2">JPG, PNG, WebP — max 5MB</p>
            </div>
          </div>
        </div>

        {/* Pricing & Variants */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-medium">Pricing</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground/60">Has variants?</span>
              <button
                type="button"
                onClick={() => setHasVariants(!hasVariants)}
                className={`w-11 h-6 rounded-full transition-colors relative ${hasVariants ? "bg-brand-blue-deep" : "bg-border"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasVariants ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          {!hasVariants ? (
            <div>
              <label className="block text-sm font-medium mb-1.5">Base Price (₦) <span className="text-red-400">*</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="input-field max-w-xs"
                placeholder="0.00"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground/50">Add product variants with individual pricing.</p>
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-2 rounded-xl relative">
                  <div>
                    <label className="block text-xs text-foreground/50 mb-1">Color</label>
                    <input value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)} className="input-field py-2 text-sm" placeholder="e.g. Black" />
                  </div>
                  <div>
                    <label className="block text-xs text-foreground/50 mb-1">Size</label>
                    <input value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)} className="input-field py-2 text-sm" placeholder="e.g. M" />
                  </div>
                  <div>
                    <label className="block text-xs text-foreground/50 mb-1">Price (₦) *</label>
                    <input type="number" min="0" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)} className="input-field py-2 text-sm" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs text-foreground/50 mb-1">Stock</label>
                    <input type="number" min="0" value={v.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)} className="input-field py-2 text-sm" placeholder="0" />
                  </div>
                  {variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-500 p-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addVariant} className="btn-secondary text-sm w-full">
                <Plus size={16} /> Add Variant
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-primary flex-1 py-4">
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : isEdit ? "Update Product" : "Create Product"}
          </button>
          <Link to="/admin/products" className="btn-secondary px-8">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
