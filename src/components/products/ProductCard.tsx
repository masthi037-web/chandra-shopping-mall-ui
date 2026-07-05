"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Clock, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, resolveImageUrl } from '@/lib/utils';
import { useWishlist } from '@/hooks/use-wishlist';
import type { ProductWithImage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { AddToCartSheet } from '../cart/AddToCartSheet';
import { useTenant } from '@/components/providers/TenantContext';
import { useProduct } from '@/hooks/use-product';

interface ProductCardProps {
  product: ProductWithImage;
  hideDescription?: boolean;
}

export const ProductCard = ({ product, hideDescription = false }: ProductCardProps) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { text, theme, surface } = useTenant();
  const productCardLayout = surface?.productCardLayout || 'default';
  const productFrame = theme?.productFrame || 'normal';
  const productStyle = theme?.productCard;

  const getRadius = (frame: string) => {
    switch (frame) {
      case 'square': return '0rem';
      case 'round': return '1.5rem';
      case 'normal': default: return '1rem';
    }
  };

  const isWishlisted = isInWishlist(product.id);

  // Logic to determine price
  const activePrice = product.pricing && product.pricing.length > 0
    ? Math.min(...product.pricing.map(p => p.price))
    : (product.price || 0);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  }

  // Carousel Logic
  // Combine generic product images and colour variant images
  const displayImages = [
    ...(product.images || []),
    ...(product.colors?.map(c => c.image) || []),
    ...(product.pricing?.flatMap(p => p.sizeColours?.map(sc => sc.productPics) || []) || [])
  ].filter(Boolean).map(url => resolveImageUrl(url));

  // Dedup images if needed (optional, keeping simple for now)
  const slides = displayImages.length > 0 ? displayImages : [resolveImageUrl(product.imageUrl)];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % slides.length);
      }, 1500); // Change slide every 1.5 seconds
      return () => clearInterval(interval);
    }
  }, [slides.length]);



  const isInactive = product.productStatus === 'INACTIVE';
  const isOutOfStock = product.productStatus === 'OUTOFSTOCK';
  const isDisabled = isInactive || isOutOfStock;

  if (productCardLayout === 'saree') {
    return (
      <Link
        href={isDisabled ? '#' : `/product/${product.id}`}
        className={cn("group block h-full", isDisabled && "cursor-not-allowed opacity-80")}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
          useProduct.getState().setSelectedProduct(product);
        }}
      >
        <div className="relative w-full h-full flex flex-col bg-background transition-all duration-300">
          {/* Image Container - Tall Aspect Ratio */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary/5 rounded-sm">
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {slides.map((imgSrc, idx) => (
                <div key={idx} className="relative w-full h-full flex-shrink-0 bg-secondary/10">
                  <Image
                    src={imgSrc || `https://picsum.photos/seed/${product.id}/300/400`}
                    alt={`${product.name} - ${idx + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                    className={cn("object-cover", isDisabled && "grayscale opacity-50")}
                  />
                </div>
              ))}
            </div>

            {/* Multiple Set Discount Badges - Top Left */}
            {product.multipleSetDiscount && typeof product.multipleSetDiscount === 'string' && (
              <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                {String(product.multipleSetDiscount).split('&&&').map((offer, idx) => {
                  if (!offer) return null;
                  const parts = String(offer).trim().split('-');
                  if (parts.length !== 2) return null;

                  const qty = parts[0].trim();
                  const discount = parts[1].trim();

                  if (!qty || !discount) return null;

                  return (
                    <div key={idx} className="bg-[#b31b20] text-white px-1.5 py-[2px] rounded-sm shadow-sm text-[9px] font-bold tracking-wide">
                      {qty} @ {discount}%
                    </div>
                  );
                })}
              </div>
            )}

            {/* Heart Icon - Top Right */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 hover:bg-transparent text-muted-foreground transition-all duration-300 z-20"
              onClick={handleWishlistClick}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-colors stroke-[1.5]",
                  isWishlisted ? "fill-primary text-primary" : "text-white drop-shadow-md"
                )}
              />
            </Button>

            {/* Bestseller Badge - Bottom Left */}
            <div className="absolute bottom-0 left-0 z-10 pointer-events-none">
              <div 
                className="bg-[#e4c275] px-2 py-[3px] text-[9px] font-bold text-[#3d2a00] uppercase tracking-wider flex items-center pr-4 shadow-sm"
                style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' }}
              >
                BESTSELLER
              </div>
            </div>

            {/* Rating Badge - Bottom Right */}
            <div className="absolute bottom-2 right-2 z-10 bg-white px-1.5 py-[2px] rounded-sm flex items-center gap-[3px] shadow-sm pointer-events-none border border-black/5">
              <span className="text-[10px] font-bold text-[#333] leading-none mt-[1px]">{(4.1 + ((Number(product.id) || product.id.toString().charCodeAt(0)) % 6) * 0.1).toFixed(1)}</span>
              <Star className="w-[10px] h-[10px] fill-[#059669] text-[#059669]" />
            </div>

            {/* Status Overlay */}
            {isDisabled && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 backdrop-blur-[2px]">
                   <span className={cn(
                    "relative z-10 text-xs font-black uppercase tracking-[0.2em] px-4 py-2 bg-white/80 rounded drop-shadow-sm",
                    isOutOfStock ? "text-rose-500" : "text-slate-500"
                  )}>
                    {isOutOfStock ? "Sold Out" : "Unavailable"}
                  </span>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="pt-3 pb-2 flex flex-col gap-1 flex-1 bg-white">
            <h3 className="font-medium text-[13px] md:text-sm text-[#333] leading-[1.3] line-clamp-2" title={product.name}>
              {product.name}
            </h3>

            <div className="flex items-end justify-between mt-auto pt-1">
              {(() => {
                let displayPrice = 0;
                let originalPriceForDisplay = 0;
                let hasDiscount = false;
                let offerPercent = 0;

                if (product.price && product.price > 0) {
                  offerPercent = product.productOffer ? parseFloat(product.productOffer.toString().replace(/[^0-9.]/g, '')) : 0;
                  if (offerPercent > 0) {
                    const discountAmount = (product.price * offerPercent) / 100;
                    displayPrice = Math.round(product.price - discountAmount);
                    originalPriceForDisplay = product.price;
                    hasDiscount = true;
                  } else {
                    const offerPrice = (product as any).priceAfterDiscount;
                    if (offerPrice && offerPrice < product.price) {
                      displayPrice = offerPrice;
                      originalPriceForDisplay = product.price;
                      hasDiscount = true;
                      offerPercent = Math.round(((product.price - offerPrice) / product.price) * 100);
                    } else {
                      displayPrice = product.price;
                    }
                  }
                } else if (product.pricing && product.pricing.length > 0) {
                  let minP = Infinity;
                  product.pricing.forEach(p => {
                    const final = (p.priceAfterDiscount && p.priceAfterDiscount > 0) ? p.priceAfterDiscount : p.price;
                    if (final < minP) minP = final;
                  });
                  displayPrice = minP;
                }

                return (
                  <div className="flex flex-col gap-[2px]">
                    {hasDiscount ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-[#888] line-through">₹{originalPriceForDisplay.toLocaleString('en-IN')}</span>
                        <span className="text-sm md:text-base font-bold text-[#111]">₹{displayPrice.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] md:text-xs font-bold text-[#e53b49] uppercase">{offerPercent}% OFF</span>
                      </div>
                    ) : (
                      <span className="text-sm md:text-base font-bold text-[#111]">₹{displayPrice.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                );
              })()}

              {!isDisabled && (
                <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="shrink-0 ml-2">
                  <AddToCartSheet product={product}>
                    <Button size="icon" className="h-8 w-8 rounded-md bg-[#eb3e45] hover:bg-[#d6343a] shadow-sm text-white">
                      <ShoppingBag className="h-[16px] w-[16px] stroke-[2]" />
                    </Button>
                  </AddToCartSheet>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={isDisabled ? '#' : `/product/${product.id}`}
      className={cn("group block h-full", isDisabled && "cursor-not-allowed opacity-80")}
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault();
          return;
        }
        useProduct.getState().setSelectedProduct(product);
      }}
    >
      <Card
        className={cn(
          "card-root relative w-full h-full overflow-hidden bg-card transition-all duration-500",
          !productStyle?.shadow && "hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]", // Default hover if no shadow config
          !productStyle?.border && "border-transparent" // Default border
        )}
        style={{
          borderRadius: getRadius(productFrame),
          boxShadow: productStyle?.shadow,
          border: productStyle?.border,
        }}
      >
        {/* Image Container - 3:2 Ratio (Shorter) */}
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-secondary/5">
          {/* Slider Container */}
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            {slides.map((imgSrc, idx) => (
              <div key={idx} className="relative w-full h-full flex-shrink-0 bg-background">
                <Image
                  src={imgSrc || `https://picsum.photos/seed/${product.id}/300/300`}
                  alt={`${product.name} - ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
                  className={cn("object-contain p-2", isDisabled && "grayscale opacity-50")}
                  data-ai-hint={product.imageHint}
                />
              </div>
            ))}
          </div>

          {/* Status Overlay */}
          {isDisabled && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 backdrop-blur-[2px]">
              <div className="relative overflow-hidden px-6 py-2 rounded-xl bg-background/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transform rotate-[-5deg]">
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                <span className={cn(
                  "relative z-10 text-xs font-black uppercase tracking-[0.2em] drop-shadow-sm",
                  isOutOfStock ? "text-rose-500" : "text-slate-400"
                )}>
                  {isOutOfStock ? "Sold Out" : "Unavailable"}
                </span>
              </div>
            </div>
          )}

          {/* Dots Indicator (visible if > 1 image) */}
          {slides.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    idx === currentImageIndex ? "bg-primary w-3" : "bg-primary/20"
                  )}
                />
              ))}
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 w-[calc(100%-24px)] items-start pointer-events-none">
            {/* Rating Badge */}
            {(() => {
              const pid = Number(product.id) || product.id.toString().charCodeAt(0);
              const randomRating = 4.1 + (pid % 6) * 0.1;

              return (
                <div className="flex items-center gap-1 bg-background/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-foreground shadow-sm pointer-events-auto border border-white/50">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{randomRating.toFixed(1)}</span>
                </div>
              );
            })()}

            {/* Offer Badge (Single) */}
            {(() => {
              if (!product.productOffer) return null;
              const offerVal = parseFloat(product.productOffer.toString().replace(/[^0-9.]/g, ''));
              if (isNaN(offerVal) || offerVal <= 0) return null;

              return (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-600 px-2.5 py-1 rounded-full text-[10px] font-bold text-primary-foreground shadow-lg shadow-rose-500/20 border-t border-white/20 animate-in fade-in zoom-in duration-300 pointer-events-auto">
                  <Sparkles className="w-3 h-3 text-primary-foreground fill-white/20" />
                  <span className="tracking-wide uppercase">{product.productOffer}{!isNaN(Number(product.productOffer)) ? '%' : ''} Off</span>
                </div>
              );
            })()}

          </div>



          {/* Top Right Badges (More Than Discount) */}
          <div className="absolute top-12 right-3 flex flex-col items-end gap-2 z-10 pointer-events-none">
            {(() => {
              if (product.multipleDiscountMoreThan) {
                const parts = String(product.multipleDiscountMoreThan).split('-');
                if (parts.length === 2) {
                  const threshold = parts[0].trim();
                  const discount = parts[1].trim();

                  return (
                    <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-primary-foreground shadow-lg shadow-indigo-500/30 border border-white/10 animate-in slide-in-from-right-4 duration-500">
                      <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300 animate-pulse" />
                      <div className="flex flex-col leading-none items-start">
                        <span className="text-[8px] opacity-90 font-medium uppercase tracking-wider">Buy &gt; {threshold}</span>
                        <span className="text-[10px] font-extrabold">Get {discount}% Off</span>
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })()}
          </div>

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-muted-foreground transition-all duration-300 shadow-sm z-20"
            onClick={handleWishlistClick}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isWishlisted ? "fill-primary text-primary" : "text-muted-foreground"
              )}
            />
          </Button>

          {/* Quick Add Overlay - Desktop Only - Hide if Disabled */}
          {!isDisabled && (
            <div className="absolute inset-x-0 bottom-0 p-3 transition-transform duration-500 ease-out z-20 translate-y-full group-hover:translate-y-0 hidden md:block">
              <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <AddToCartSheet product={product}>
                  <Button className="w-full rounded-full shadow-lg shadow-primary/25 font-semibold h-10 text-sm transition-all hover:shadow-primary/40">
                    {text.quickAddButton || "Quick Add"}
                  </Button>
                </AddToCartSheet>
              </div>
            </div>
          )}
        </div>

        {/* Content - Compact Spacing */}
        <CardContent className="p-4 flex flex-col gap-2 flex-1">
          {/* Header Row */}
          <div className="flex justify-between items-start gap-2 min-h-[3.5rem]">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-bold text-sm md:text-base text-foreground leading-tight overflow-hidden",
                useTenant().id.toLowerCase().includes('anantha') ? "font-display uppercase tracking-[0.15em] text-[11px]" : "font-headline line-clamp-2"
              )} title={product.name}>
                {product.name}
              </h3>
            </div>
            <div className="flex flex-col items-end shrink-0 pt-0.5">
              {(() => {
                let displayPrice = 0;
                let originalPriceForDisplay = 0;
                let hasDiscount = false;
                let showStartsFrom = false;

                if (product.price && product.price > 0) {
                  const offerPercent = product.productOffer ? parseFloat(product.productOffer.toString().replace(/[^0-9.]/g, '')) : 0;

                  if (offerPercent > 0) {
                    const discountAmount = (product.price * offerPercent) / 100;
                    displayPrice = Math.round(product.price - discountAmount);
                    originalPriceForDisplay = product.price;
                    hasDiscount = true;
                  } else {
                    const offerPrice = (product as any).priceAfterDiscount;
                    if (offerPrice && offerPrice < product.price) {
                      displayPrice = offerPrice;
                      originalPriceForDisplay = product.price;
                      hasDiscount = true;
                    } else {
                      displayPrice = product.price;
                    }
                  }
                } else if (product.pricing && product.pricing.length > 0) {
                  showStartsFrom = true;
                  let minP = Infinity;
                  product.pricing.forEach(p => {
                    const final = (p.priceAfterDiscount && p.priceAfterDiscount > 0) ? p.priceAfterDiscount : p.price;
                    if (final < minP) minP = final;
                  });
                  displayPrice = minP;
                }

                return (
                  <span className="font-headline font-bold text-base text-primary tracking-tight text-right">
                    <span className="flex flex-col items-end">
                      {showStartsFrom && <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none mb-0.5">Starts from</span>}
                      <div className="flex items-center gap-1.5 justify-end">
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through font-medium">₹{originalPriceForDisplay}</span>
                        )}
                        <span className="leading-none">₹{displayPrice}</span>
                      </div>
                    </span>
                  </span>
                );
              })()}
            </div>
          </div>


          {/* Rating Row (Classic positioning in body) */}
          <div className="flex items-center gap-1 -mt-0.5">
            {(() => {
              // Deterministic Random Rating Logic based on Product ID
              // Generates a rating between 4.1 and 4.6
              const pid = Number(product.id) || product.id.toString().charCodeAt(0);
              const randomRating = 4.1 + (pid % 6) * 0.1;

              return (
                <>
                  <div className="flex text-primary">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3 h-3 fill-current",
                          i >= Math.floor(randomRating) && "text-muted-foreground/20 fill-muted-foreground/20"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium ml-1">({randomRating.toFixed(1)})</span>
                </>
              );
            })()}
          </div>

          {!hideDescription && (
            <div className="hidden md:block">
              <p className="text-muted-foreground/80 text-[11px] leading-snug line-clamp-2 font-medium break-words" title={product.description}>
                {product.description}
              </p>
            </div>
          )}




          {/* Footer Row */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="p-1 px-2 rounded-full bg-secondary/40 text-foreground/70 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" />
                <span>{product.deliveryTime}</span>
              </div>
            </div>

            {/* Multiple Set Discount Badges */}
            {/* Multiple Set Discount Badges */}
            {product.multipleSetDiscount && typeof product.multipleSetDiscount === 'string' && (
              <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                {String(product.multipleSetDiscount).split('&&&').map((offer, idx) => {
                  if (!offer) return null;
                  const parts = String(offer).trim().split('-');
                  if (parts.length !== 2) return null;

                  const qty = parts[0].trim();
                  const discount = parts[1].trim();

                  if (!qty || !discount) return null;

                  return (
                    <div key={idx} className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-primary-foreground px-2 py-0.5 rounded-full shadow-sm">
                      <Tag className="w-2.5 h-2.5 fill-white/20" />
                      <span className="text-[9px] font-bold uppercase tracking-tight leading-none">
                        Buy {qty} Get {discount}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}


          </div>

          {/* Mobile Quick Add Button - Content Area - Hide if Disabled */}
          {!isDisabled && (
            <div className="mt-1 block md:hidden" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <AddToCartSheet product={product}>
                <Button className="w-full rounded-full shadow-lg shadow-primary/25 font-semibold h-9 text-sm transition-all hover:shadow-primary/40">
                  {text.quickAddButton || "Quick Add"}
                </Button>
              </AddToCartSheet>
            </div>
          )}
        </CardContent>
      </Card>
    </Link >
  );
};
