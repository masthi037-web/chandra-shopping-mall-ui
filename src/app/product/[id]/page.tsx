'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { ProductWithImage, ProductVariant, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Star, Heart, Minus, Plus, ArrowLeft, Loader2, Search, Check, Package } from 'lucide-react';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProductImageCarousel } from '@/components/products/ProductImageCarousel';
import Recommendations from '@/components/products/Recommendations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useProduct } from '@/hooks/use-product';
import { useTenant } from '@/components/providers/TenantContext';
// Import mock categories as fallback ONLY
import { categories as mockCategories } from '@/data/products';
import { fetchCategories } from '@/services/product.service';

const VariantSelector = ({
  variant,
  selectedOption,
  onOptionChange,
}: {
  variant: ProductVariant;
  selectedOption: string;
  onOptionChange: (option: string) => void;
}) => (
  <div>
    <h3 className="text-sm font-medium text-foreground">{variant.name}</h3>
    <div className="flex flex-wrap gap-2 mt-2">
      {variant.options.map((option) => (
        <Button
          key={option}
          variant={selectedOption === option ? 'default' : 'outline'}
          onClick={() => onOptionChange(option)}
          className={cn(
            'rounded-full',
            selectedOption === option
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-foreground'
          )}
        >
          {option}
        </Button>
      ))}
    </div>
  </div>
);

const ColourCard = ({
  name,
  image,
  isSelected,
  active = true,
  statusLabel,
  onClick,
}: {
  name: string;
  image?: string;
  isSelected: boolean;
  active?: boolean;
  statusLabel?: string;
  onClick: () => void;
}) => (
  <div
    onClick={active ? onClick : undefined}
    className={cn(
      "relative flex flex-col items-center justify-start p-1.5 rounded-xl border transition-all duration-300 ease-out h-auto min-h-[80px]",
      active ? "cursor-pointer hover:border-primary/20 hover:bg-secondary/20" : "cursor-not-allowed bg-muted/20 border-border grayscale-[0.8]",
      isSelected && active
        ? "border-primary bg-primary/[0.03] shadow-sm ring-0 scale-[1.02]"
        : !active ? "border-transparent opacity-60" : "border-transparent bg-secondary/20 text-muted-foreground/80"
    )}
  >
    {!active && (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 rounded-xl overflow-hidden">
        <div className="relative overflow-hidden px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md border border-white/20 shadow-sm rotate-[-4deg]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          <span className="relative z-10 text-[8px] font-black uppercase tracking-wider text-rose-500 drop-shadow-sm">
            {statusLabel || "Sold Out"}
          </span>
        </div>
      </div>
    )}
    {isSelected && active && (
      <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm z-10">
        <Check className="w-2.5 h-2.5" strokeWidth={3} />
      </div>
    )}
    <div className="relative w-9 h-9 mb-1 rounded-full overflow-hidden border border-border/40">
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-secondary/50 flex items-center justify-center text-[9px] font-bold text-muted-foreground/40">
          {name.charAt(0)}
        </div>
      )}
    </div>
    <span className={cn(
      "text-[10px] leading-tight font-bold tracking-tight break-words whitespace-normal text-center px-1 mt-1",
      isSelected ? "text-primary" : "text-foreground",
      !active && "line-through decoration-destructive/30 decoration-1"
    )}>
      {name}
    </span>
  </div>
);

// Reviews are now fetched from product.reviews
const getReviewStats = (reviews: any[]) => {
  if (!reviews || reviews.length === 0) return { average: 0, count: 0, distribution: [] };
  const count = reviews.length;
  const average = reviews.reduce((acc, r) => acc + r.rating, 0) / count;
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    percentage: (reviews.filter(r => Math.floor(r.rating) === star).length / count) * 100
  }));
  return { average, count, distribution };
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { addToCart, setCartOpen, companyDetails } = useCart();
  const { toast } = useToast();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  const tenant = useTenant();

  const [product, setProduct] = useState<ProductWithImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [selectedPricingId, setSelectedPricingId] = useState<string | null>(null);
  const [selectedSizeColourId, setSelectedSizeColourId] = useState<string | null>(null);
  const [selectedColourId, setSelectedColourId] = useState<string>("");
  // We keep 'selectedVariants' for backward compatibility if backend returns 'variants' array separately,
  // but for pricing options, we primarily use selectedPricingId.
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      if (!id) return;

      setLoading(true);
      let foundProduct: ProductWithImage | undefined;

      const globalProducts = useProduct.getState().products;
      const selectedProduct = useProduct.getState().selectedProduct;

      let storeProduct: ProductWithImage | undefined;

      // 0. Check for explicitly selected product (from Direct Navigation)
      if (selectedProduct && String(selectedProduct.id) === String(id)) {
        // Ensure it's treated as ProductWithImage if needed, or cast/map it
        // Store might hold generic Product or ProductWithImage.
        // We'll try to find image hint if missing.
        const image = PlaceHolderImages.find(img => img.id === selectedProduct.imageId)
          || PlaceHolderImages.find(img => img.id === 'product-1');

        storeProduct = {
          ...selectedProduct,
          imageUrl: selectedProduct.imageUrl || image?.imageUrl || '',
          imageHint: (selectedProduct as any).imageHint || image?.imageHint || 'product image'
        };
      } else {
        storeProduct = globalProducts.find(p => String(p.id) === String(id)) as ProductWithImage | undefined;
      }

      if (storeProduct) {
        const image = PlaceHolderImages.find(img => img.id === storeProduct.imageId)
          || PlaceHolderImages.find(img => img.id === 'product-1');

        foundProduct = {
          ...storeProduct,
          imageUrl: storeProduct.imageUrl || image?.imageUrl || '',
          imageHint: storeProduct.imageHint || image?.imageHint || 'product image',
        };
      }

      // 1. Try fetching from API if companyDetails exists AND not found in store
      if (!foundProduct && companyDetails?.companyId) {
        try {
          // Optimization: Check if we have products in global store first? 
          // For now, fetch transparently or use cache. 
          // Ideally fetchCategories is cached or we rely on client-side store if hydrated.
          const fetchedCategories = await fetchCategories(companyDetails.companyId, companyDetails.deliveryBetween);
          const allApiProducts = fetchedCategories.flatMap(c => c.catalogs.flatMap(ca => ca.products));
          const apiProduct = allApiProducts.find(p => String(p.id) === String(id));

          if (apiProduct) {
            const image = PlaceHolderImages.find(img => img.id === apiProduct.imageId)
              || PlaceHolderImages.find(img => img.id === 'product-1');

            foundProduct = {
              ...apiProduct,
              id: String(apiProduct.id),
              imageUrl: apiProduct.imageUrl || image?.imageUrl || '',
              imageHint: image?.imageHint || 'product image',
            };
          }
        } catch (error) {
          console.error("Failed to fetch product from API", error);
        }
      }

      // 2. Fallback to Mock Data
      if (!foundProduct) {
        const allMockProducts = mockCategories.flatMap(c => c.catalogs.flatMap(ca => ca.products));
        const mockData = allMockProducts.find(p => String(p.id) === String(id));

        if (mockData) {
          const image = PlaceHolderImages.find(img => img.id === mockData.imageId);
          foundProduct = {
            ...mockData,
            imageUrl: image?.imageUrl || '',
            imageHint: image?.imageHint || 'product image',
          };
        }
      }

      if (isMounted) {
        setProduct(foundProduct || null);

        // Initialize pricing selection
        if (foundProduct && foundProduct.pricing && foundProduct.pricing.length > 0) {
          // Default to first ACTIVE option if available, else first
          const firstPricing = foundProduct.pricing.find(p => p.sizeStatus !== 'OUTOFSTOCK' && p.sizeStatus !== 'INACTIVE') || foundProduct.pricing[0];
          setSelectedPricingId(firstPricing.id);

          // Default to first ACTIVE style if available
          if (firstPricing.sizeColours && firstPricing.sizeColours.length > 0) {
            const firstActiveColour = firstPricing.sizeColours.find(sc => sc.sizeColourStatus !== 'OUTOFSTOCK' && sc.sizeColourStatus !== 'INACTIVE') || firstPricing.sizeColours[0];
            setSelectedSizeColourId(firstActiveColour.id);
          }
        }

        // Initialize colour
        if (foundProduct && foundProduct.colors && foundProduct.colors.length > 0) {
          setSelectedColourId(foundProduct.colors[0].id);
        }

        // Initialize legacy variants
        if (foundProduct?.variants) {
          const initialState: Record<string, string> = {};
          foundProduct.variants.forEach((variant) => {
            initialState[variant.name] = variant.options[0];
          });
          setSelectedVariants(initialState);
        }

        setLoading(false);
      }
    }

    loadProduct();

    return () => { isMounted = false; };
  }, [id, companyDetails]);


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto mb-24">
          <div className="w-24 h-24 bg-secondary/30 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-500">
            <div className="relative">
              <Search size={40} className="text-muted-foreground" />
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                <div className="w-4 h-4 rounded-full bg-destructive/80" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
              Product Not Found
            </h1>
            <p className="text-muted-foreground text-lg">
              We couldn't locate the product you're looking for. It might have been moved or doesn't exist.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
            <Button onClick={() => router.push('/')} size="lg" className="rounded-full px-8 gap-2">
              <ArrowLeft size={16} /> Back to Home
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.back()} className="rounded-full px-8">
              Go Back
            </Button>
          </div>
        </div>

        <Separator className="mb-12" />

        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Explore Popular Items</h2>
            <p className="text-muted-foreground">You might find something else you love</p>
          </div>
          <Recommendations />
        </div>
      </div>
    );
  }

  // Derived state for current pricing option
  const currentPricingOption = product.pricing?.find(p => p.id === selectedPricingId) || (product.pricing?.[0]);
  // Using 'SizeColours' terminology
  // Note: SizeColours price usually adds ON TOP of the variant price.

  // Get sizeColours available for current pricing option
  const availableSizeColours = currentPricingOption?.sizeColours || [];

  // Local state for selected sizeColours
  // Local state for selected sizeColours (hoisted to top)

  // Calculate total price
  const basePrice = currentPricingOption ? currentPricingOption.price : product.price;
  const sizeColoursPrice = availableSizeColours
    .filter(sc => sc.id === selectedSizeColourId)
    .reduce((sum, sc) => sum + sc.price, 0);

  // Calculate Price Logic (Mirror ProductCard)
  // 1. Resolve base price for this variant
  let effectiveBasePrice = basePrice;
  let originalPrice = basePrice;
  let offerPercentage = 0;

  const offerPercent = product.productOffer ? parseFloat(product.productOffer.toString().replace(/[^0-9.]/g, '')) : 0;

  // Condition A: Percentage Offer exists (and variant price matches base product price)
  if (offerPercent > 0 && basePrice === product.price) {
    const discountAmount = (basePrice * offerPercent) / 100;
    effectiveBasePrice = Math.round(basePrice - discountAmount);
    offerPercentage = offerPercent;
  }
  // Condition B: Explicit Variant Discount
  else if (currentPricingOption && currentPricingOption.priceAfterDiscount && currentPricingOption.priceAfterDiscount > 0) {
    effectiveBasePrice = currentPricingOption.priceAfterDiscount;
    originalPrice = currentPricingOption.price;
    offerPercentage = Math.round(((originalPrice - effectiveBasePrice) / originalPrice) * 100);
  }
  // Condition C: Explicit Product Discount (fallback)
  else if (basePrice === product.price && product.priceAfterDiscount && product.priceAfterDiscount > 0) {
    effectiveBasePrice = product.priceAfterDiscount;
    originalPrice = product.price;
    offerPercentage = Math.round(((originalPrice - effectiveBasePrice) / originalPrice) * 100);
  }

  const finalPrice = effectiveBasePrice + sizeColoursPrice;
  const hasDiscount = effectiveBasePrice < originalPrice;

  const handleAddToCart = () => {
    // Construct the product to add to cart
    const variantInfo = { ...selectedVariants };
    if (currentPricingOption) {
      variantInfo['Quantity'] = currentPricingOption.quantity;
    }

    const sizeColourObjects = availableSizeColours.filter(sc => sc.id === selectedSizeColourId);

    // Resolve selected colour object
    const selectedColour = product.colors?.find(c => c.id === selectedColourId);
    const colourToAdd = selectedColour ? {
      id: selectedColour.id,
      name: selectedColour.name,
      image: selectedColour.image || ''
    } : undefined;

    // Safety check for out of stock selection
    const isOutOfStock = product.productStatus === 'OUTOFSTOCK' ||
      (currentPricingOption?.sizeStatus === 'OUTOFSTOCK') ||
      (sizeColourObjects.some(sc => sc.sizeColourStatus === 'OUTOFSTOCK')) ||
      (selectedColour?.colourStatus === 'OUTOFSTOCK');

    if (isOutOfStock) {
      toast({
        title: "Out of Stock",
        description: "One of the selected options is currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    addToCart(
      { ...product, price: effectiveBasePrice, productSizeId: selectedPricingId || undefined },
      variantInfo,
      sizeColourObjects,
      colourToAdd
    );
    setCartOpen(true);
  };

  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground group">
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image Carousel */}
        <div className="relative aspect-[4/5] w-full rounded-3xl overflow-hidden bg-secondary/10 border border-border/50 shadow-sm md:aspect-auto md:h-[480px]">
          {(() => {
            // Collect all possible images
            const imagesList: string[] = [];

            // Helper to check if an image is a known dummy/placeholder
            const isDummyImage = (src: string) => {
              if (!src) return true;
              return src.includes('images.unsplash.com') && src.includes('w=800&q=80'); // Assuming your PlaceHolderImages have similar pattern
            };

            // 1. Prioritize selected Size-Colour image
            if (selectedSizeColourId) {
              const sc = availableSizeColours.find(sc => sc.id === selectedSizeColourId);
              if (sc && sc.productPics && sc.productPics.trim() !== "") imagesList.push(sc.productPics);
            }

            // 2. If colours exist, add selected colour image
            if (product.colors && product.colors.length > 0) {
              const selected = product.colors.find(c => c.id === selectedColourId);
              if (selected && selected.image && selected.image.trim() !== "" && !imagesList.includes(selected.image)) {
                imagesList.push(selected.image);
              }
            }

            // We have real variant images
            const hasVariantImages = imagesList.length > 0;

            // 3. Add base product image(s) ONLY IF we don't have variant images OR the base image is not a dummy
            if (product.images && product.images.length > 0) {
              product.images.forEach(img => {
                if (img && !imagesList.includes(img)) {
                  // If we already have variant images, try to skip dummy base images
                  if (!hasVariantImages || !isDummyImage(img)) {
                    imagesList.push(img);
                  }
                }
              });
            } else if (product.productImage && !imagesList.includes(product.productImage)) {
              if (!hasVariantImages || !isDummyImage(product.productImage)) {
                imagesList.push(product.productImage);
              }
            } else if (product.imageUrl && !imagesList.includes(product.imageUrl)) {
              // Many placeholders use standard imageUrls. If we have a variant image, we skip the base image if it looks like a dummy.
              // We will be aggressive here and just skip default base single image if variant images exist, as the user requested.
              if (!hasVariantImages) {
                imagesList.push(product.imageUrl);
              }
            }

            // Fallback if empty (should only happen if literally nothing is selected and no product image exists)
            if (imagesList.length === 0) {
              imagesList.push(product.imageUrl || ''); // Give it at least something
            }

            return <ProductImageCarousel images={imagesList} alt={product.name} />
          })()}

          {(product.productStatus === 'OUTOFSTOCK' || product.productStatus === 'INACTIVE') && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 backdrop-blur-[2px]">
              <div className="relative overflow-hidden px-8 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transform rotate-[-5deg] animate-in zoom-in duration-500">
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                <span className={cn(
                  "relative z-10 text-xl font-black uppercase tracking-[0.2em] drop-shadow-sm",
                  product.productStatus === 'OUTOFSTOCK' ? "text-rose-500" : "text-slate-400"
                )}>
                  {product.productStatus === 'OUTOFSTOCK' ? "Sold Out" : "Unavailable"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="space-y-1.5">
              <span className={cn(
                "text-[10px] font-black tracking-[0.2em] uppercase block mb-1",
                tenant.id.toLowerCase().includes('anantha') ? "text-primary/60 font-display tracking-[0.3em]" : "text-primary/60"
              )}>
                {companyDetails?.companyName || 'Digi Turu'}
              </span>
              <h1 className={cn(
                "text-2xl md:text-5xl font-bold text-foreground leading-[1.15] tracking-tight",
                tenant.id.toLowerCase().includes('anantha') ? "font-headline uppercase" : "font-headline"
              )}>
                {product.name}
              </h1>
            </div>

            <div className="flex items-baseline gap-3 mt-4">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Rs. {(finalPrice).toFixed(2)}
              </h2>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground/60 line-through decoration-destructive/30 decoration-1">
                  Rs. {(originalPrice + sizeColoursPrice).toFixed(2)}
                </span>
              )}
              {hasDiscount && (
                <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-1 rounded-full shadow-sm animate-in zoom-in ml-2">
                  {offerPercentage}% OFF
                </span>
              )}
              <div className="flex-1" />
              <Button
                variant="outline"
                size="icon"
                className={cn("rounded-full h-10 w-10 transition-colors", isWishlisted && "text-red-500 bg-red-50 border-red-200")}
                onClick={() => toggleWishlist(product)}
              >
                <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
              </Button>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground/60 mt-1.5 flex items-center gap-2">
              <Check className="w-3 h-3 text-emerald-500" />
              Taxes included. {companyDetails?.freeDeliveryCost && `Free shipping on orders over ${companyDetails.freeDeliveryCost}/-`}
            </p>

            {/* Rating simplified - Random Logic */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 text-primary">
                {(() => {
                  const pid = Number(product.id) || product.id.toString().charCodeAt(0);
                  const randomRating = 4.1 + (pid % 6) * 0.1;
                  return [...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < Math.floor(randomRating) ? 'fill-primary text-primary' : 'text-muted-foreground/30 fill-muted-foreground/30')} />
                  ));
                })()}
              </div>
              <span className="text-muted-foreground text-sm font-medium ml-1">
                ({(() => {
                  const pid = Number(product.id) || product.id.toString().charCodeAt(0);
                  return (4.1 + (pid % 6) * 0.1).toFixed(1);
                })()})
              </span>
            </div>

            <p className="mt-4 text-muted-foreground leading-relaxed text-base">{product.description}</p>
          </div>

          {/* Metadata Grid (only if data exists) */}
          {(product.ingredients || product.bestBefore) && (
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
              {product.ingredients && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ingredients</span>
                  <p className="text-sm font-medium">{product.ingredients}</p>
                </div>
              )}
              {product.bestBefore && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Shelf Life</span>
                  <p className="text-sm font-medium">{product.bestBefore}</p>
                </div>
              )}
            </div>
          )}

          {product.instructions && (
            <div className="bg-secondary/20 rounded-xl p-4 border border-border/50">
              <p className="text-sm text-muted-foreground">{product.instructions}</p>
            </div>
          )}

          <div className="space-y-8">
            {/* Pricing Options (Select Quantity) */}
            {product.pricing && product.pricing.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/30 mb-4">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">Select Option</label>
                  <span className="text-[9px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">REQUIRED</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {(() => {
                    const prices = product.pricing.map(p => p.price);
                    const allPricesSame = prices.every(p => p === prices[0]);

                    return product.pricing.map((option) => {
                      const isActive = option.sizeStatus !== 'INACTIVE' && option.sizeStatus !== 'OUTOFSTOCK';
                      const isSelected = selectedPricingId === option.id;

                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            if (!isActive) return;
                            setSelectedPricingId(option.id);
                            // Auto-select first ACTIVE style (not OOS) when size is changed
                            if (option.sizeColours && option.sizeColours.length > 0) {
                              const firstActiveColour = option.sizeColours.find(sc => sc.sizeColourStatus !== 'OUTOFSTOCK' && sc.sizeColourStatus !== 'INACTIVE') || option.sizeColours[0];
                              setSelectedSizeColourId(firstActiveColour.id);
                            } else {
                              setSelectedSizeColourId(null);
                            }
                          }}
                          className={cn(
                            "relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl border transition-all duration-300 h-11",
                            isSelected && isActive
                              ? "border-primary bg-primary/[0.03] shadow-sm scale-[1.02]"
                              : isActive
                                ? "border-border/60 bg-background/50 hover:border-primary/20 hover:bg-background"
                                : "cursor-not-allowed bg-muted/10 border-border/40 opacity-50"
                          )}
                        >
                          {!isActive && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
                              <div className="relative overflow-hidden px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md border border-white/20 shadow-sm rotate-[-4deg]">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                <span className="relative z-10 text-[8px] font-black uppercase tracking-wider text-rose-500 drop-shadow-sm">
                                  Sold Out
                                </span>
                              </div>
                            </div>
                          )}
                          {isSelected && isActive && (
                            <div className="absolute top-2 right-2 text-primary">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                          <span className={cn(
                            "text-base font-bold mb-0.5 transition-colors",
                            isSelected && isActive ? "text-primary" : "text-foreground",
                            !isActive && "line-through decoration-destructive/30 decoration-1"
                          )}>
                            <div className="font-medium text-center">
                              {option.quantity}
                              {option.price > 0 && !allPricesSame && isActive && <span className="ml-1 text-xs text-primary font-bold">+₹{option.price}</span>}
                            </div>
                          </span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
            {/* Colour Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/30 mb-6">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">Select Color</label>
                  <span className="text-[9px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">REQUIRED</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.colors.map((colour) => {
                    const isActive = colour.colourStatus !== 'INACTIVE' && colour.colourStatus !== 'OUTOFSTOCK';
                    const statusLabel = colour.colourStatus === 'OUTOFSTOCK' ? 'Sold Out' : (colour.colourStatus === 'INACTIVE' ? 'Unavailable' : undefined);

                    return (
                      <ColourCard
                        key={colour.id}
                        name={colour.name}
                        image={colour.image}
                        isSelected={selectedColourId === colour.id}
                        active={isActive}
                        statusLabel={statusLabel}
                        onClick={() => setSelectedColourId(colour.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* SizeColours (Select Colour) */}
            {availableSizeColours.length > 0 && (
              <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/30 mb-6">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">Select Style</label>
                  <span className="text-[9px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">REQUIRED</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {availableSizeColours.map(sc => {
                    const isSelected = selectedSizeColourId === sc.id;
                    const isActive = sc.sizeColourStatus !== 'INACTIVE' && sc.sizeColourStatus !== 'OUTOFSTOCK';

                    return (
                      <button
                        key={sc.id}
                        onClick={() => isActive && setSelectedSizeColourId(sc.id)}
                        className={cn(
                          "relative flex flex-col items-center p-1.5 rounded-xl border transition-all duration-300 h-[80px] sm:h-[90px]",
                          isSelected && isActive
                            ? "border-primary bg-primary/[0.03] shadow-md scale-[1.02]"
                            : isActive
                              ? "border-border/40 bg-secondary/10 hover:border-primary/20 hover:bg-secondary/20"
                              : "cursor-not-allowed bg-muted/10 border-border/20 opacity-50"
                        )}
                      >
                        {!isActive && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
                            <div className="relative overflow-hidden px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md border border-white/20 shadow-sm rotate-[-4deg]">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                              <span className="relative z-10 text-[8px] font-black uppercase tracking-wider text-rose-500 drop-shadow-sm">
                                Sold Out
                              </span>
                            </div>
                          </div>
                        )}
                        {isSelected && isActive && (
                          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-sm z-10">
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                        <div className="relative w-10 h-10 mb-1.5 rounded-full overflow-hidden border border-border/50 bg-white">
                          {sc.productPics ? (
                            <img src={sc.productPics} alt={sc.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground/50">
                              {sc.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className={cn(
                          "text-xs font-bold tracking-tight line-clamp-1 w-full text-center px-1 mb-0.5 transition-colors",
                          isSelected && isActive ? "text-primary" : "text-foreground",
                          !isActive && "line-through decoration-destructive/30 decoration-1"
                        )}>
                          {sc.name}
                        </span>
                        {isActive && (
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider leading-none", isSelected ? "text-primary/80" : "text-muted-foreground")}>
                            {sc.price > 0 ? `+₹${sc.price}` : "Standard"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* No unconditional separator here if not needed */}

          {/* Bottom Bar Actions - Raised to accommodate BottomNavigation on mobile */}
          <div className="fixed bottom-[60px] left-0 right-0 p-5 bg-background/90 backdrop-blur-xl border-t border-border/40 z-20 md:static md:p-0 md:bg-transparent md:border-0 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
            <div className="container mx-auto md:px-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-0.5">Estimated Total</p>
                  <h2 className="text-2xl font-bold font-headline text-primary tracking-tight">₹{(finalPrice * quantity).toFixed(2)}</h2>
                </div>
                {(() => {
                  const selectedSizeColour = currentPricingOption?.sizeColours?.find(sc => sc.id === selectedSizeColourId);
                  const selectedColour = product.colors?.find(c => c.id === selectedColourId);
                  const isOutOfStock = product.productStatus === 'OUTOFSTOCK' ||
                    (currentPricingOption?.sizeStatus === 'OUTOFSTOCK') ||
                    (selectedSizeColour?.sizeColourStatus === 'OUTOFSTOCK') ||
                    (selectedColour?.colourStatus === 'OUTOFSTOCK') ||
                    (selectedColour?.colourStatus === 'INACTIVE');

                  return (
                    <Button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      size="lg"
                      className={cn(
                        "flex-1 max-w-[240px] h-12 text-base font-bold rounded-2xl shadow-xl transition-all duration-300 active:scale-[0.98]",
                        isOutOfStock
                          ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/30 border-t border-white/20"
                      )}
                    >
                      {isOutOfStock ? "Out of Stock" : (
                        <>
                          Add to Cart
                          <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-sm">
                            <span className="sr-only">items</span>
                            <svg className="w-5 h-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                          </span>
                        </>
                      )}
                    </Button>
                  );
                })()}
              </div>
            </div>
          </div>
          {/* Spacer for fixed bottom bar on mobile (NavHeight + ActionHeight) */}
          <div className="h-40 md:hidden"></div>
        </div>
      </div>

      <div className="mt-20">
        <h2 className="font-headline text-3xl md:text-3xl font-bold mb-8 text-foreground/80">
          Customer Reviews
        </h2>
        {/* ... reviews section stays same or simplified ... */}
        <div className="grid md:grid-cols-5 gap-8 lg:gap-12">
          {/* ... existing review UI ... */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-col items-center justify-center bg-secondary/30 rounded-2xl p-6 border border-border/50">
              {(() => {
                const pid = Number(product.id) || product.id.toString().charCodeAt(0);
                const randomRating = 4.1 + (pid % 6) * 0.1;
                return (
                  <>
                    <p className="text-5xl font-bold text-foreground">{randomRating.toFixed(1)}</p>
                    <div className="flex items-center gap-1 text-primary mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-6 w-6", i < Math.floor(randomRating) ? 'fill-primary text-primary' : 'fill-muted-foreground/20 text-muted-foreground/20')} />
                      ))}
                    </div>
                  </>
                );
              })()}
              {/* <p className="text-muted-foreground text-sm mt-2">Based on {product.reviews?.length || 0} reviews</p> */}
            </div>
          </div>
          {/* ... keeping existing review list simplified for brevity in this replace ... */}
          <div className="md:col-span-3">
            <div className="space-y-6">
              {(product.reviews || []).map((review) => (
                <div key={review.id} className="flex gap-4 p-4 rounded-2xl bg-secondary/10 border border-border/40">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={review.avatar} alt={review.author} />
                    <AvatarFallback>{review.author ? review.author.charAt(0) : 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{review.author}</p>
                      <div className="flex items-center gap-0.5 text-primary">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? 'fill-primary text-primary' : 'fill-muted-foreground/20 text-muted-foreground/20')} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{review.date}</p>
                    <p className="mt-3 text-foreground/90 text-sm leading-relaxed">{review.text}</p>
                  </div>
                </div>
              ))}
              {(!product.reviews || product.reviews.length === 0) && (
                <div className="text-center py-10 text-muted-foreground">
                  {/* <p>No reviews yet. Be the first to review!</p> */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



    </div>
  );
}
