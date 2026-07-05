"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import confetti from "canvas-confetti";
import {
  Sheet,
  SheetContent,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, Check, Plus, ShoppingBag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ProductWithImage, ProductVariant, ProductSizeColourOption } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useSheetBackHandler } from "@/hooks/use-sheet-back-handler";
import { useTenant } from "@/components/providers/TenantContext";

interface AddToCartSheetProps {
  product: ProductWithImage;
  children: React.ReactNode;
}

// --- styled components for the modern look ---

const OptionCard = ({
  label,
  subLabel,
  isSelected,
  active,
  statusLabel,
  onClick,
}: {
  label: string;
  subLabel?: React.ReactNode;
  isSelected: boolean;
  active: boolean;
  statusLabel?: string;
  onClick: () => void;
}) => {
  const { theme } = useTenant();
  const productCard = theme?.productCard;

  return (
    <div
      onClick={active ? onClick : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border-2 transition-all duration-300 ease-out",
        active ? "cursor-pointer hover:border-primary/30 hover:bg-secondary/30" : "cursor-not-allowed bg-muted/30 border-input grayscale-[0.5]",
        isSelected && active
          ? "bg-primary/5 shadow-md ring-0 scale-[1.02]"
          : !active ? "border-transparent opacity-80" : "border-transparent bg-secondary/30 text-muted-foreground"
      )}
      style={{
        borderColor: isSelected && active ? 'hsl(var(--primary))' : 'transparent',
        borderStyle: isSelected && active ? 'solid' : 'none',
        borderWidth: isSelected && active ? '2px' : '0px',
        ...(isSelected && active && productCard?.border ? { border: productCard.border } : {}),
        borderRadius: productCard?.radius || '0.75rem'
      }}
    >
    {!active && (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 rounded-xl overflow-hidden">
        <div className="relative overflow-hidden px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md border border-white/20 shadow-sm rotate-[-4deg]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          <span className="relative z-10 text-[8px] font-black uppercase tracking-wider text-rose-500 drop-shadow-sm">
            {statusLabel || "Sold Out"}
          </span>
        </div>
      </div>
    )}
    {isSelected && active && (
      <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
        <Check className="w-2.5 h-2.5" strokeWidth={3} />
      </div>
    )}
    <span className={cn(
      "text-sm font-bold tracking-tight",
      isSelected ? "text-primary" : "text-foreground",
      !active && "line-through decoration-destructive/30 decoration-1"
    )}>
      {label}
    </span>
    {subLabel && (
      <div className={cn("mt-0.5", isSelected ? "text-primary/80" : "text-muted-foreground", !active && "opacity-50")}>
        {subLabel}
      </div>
    )}
  </div>
);
};

const ColourCard = ({
  name,
  image,
  isSelected,
  active,
  statusLabel,
  onClick,
  extraPrice = 0,
}: {
  name: string;
  image?: string;
  isSelected: boolean;
  active: boolean;
  statusLabel?: string;
  onClick: () => void;
  extraPrice?: number;
}) => {
  const { theme } = useTenant();
  const productCard = theme?.productCard;

  return (
    <div
      onClick={active ? onClick : undefined}
      className={cn(
        "relative flex flex-col items-center justify-start p-2 rounded-xl border-2 transition-all duration-300 ease-out h-auto min-h-[88px]",
        active ? "cursor-pointer hover:border-primary/30 hover:bg-secondary/30" : "cursor-not-allowed bg-muted/30 border-input grayscale-[0.8]",
        isSelected && active
          ? "bg-primary/5 shadow-md ring-0 scale-[1.02]"
          : !active ? "border-transparent opacity-80" : "border-transparent bg-secondary/30 text-muted-foreground"
      )}
      style={{
        borderColor: isSelected && active ? 'hsl(var(--primary))' : 'transparent',
        borderStyle: isSelected && active ? 'solid' : 'none',
        borderWidth: isSelected && active ? '2px' : '0px',
        ...(isSelected && active && productCard?.border ? { border: productCard.border } : {}),
        borderRadius: productCard?.radius || '0.75rem'
      }}
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
    <div className="relative w-10 h-10 mb-1.5 rounded-full overflow-hidden border border-border/50">
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground/50">
          {name.charAt(0)}
        </div>
      )}
    </div>
    <span className={cn(
      "text-[10px] leading-tight font-bold tracking-tight break-words whitespace-normal text-center px-1 mt-1 group-disabled:text-muted-foreground/50",
      isSelected ? "text-primary" : "text-foreground",
      !active && "line-through decoration-destructive/30 decoration-1"
    )}>
      {name}
      {extraPrice > 0 && <span className="ml-0.5 text-[10px] text-primary font-extrabold">(+₹{extraPrice})</span>}
    </span>
  </div>
);
};

const SizeColourRow = ({
  sizeColour,
  isSelected,
  onToggle,
}: {
  sizeColour: ProductSizeColourOption;
  isSelected: boolean;
  onToggle: () => void;
}) => (
  <div
    onClick={onToggle}
    className={cn(
      "group flex items-center justify-between p-3 rounded-xl transition-all duration-200 cursor-pointer border border-transparent",
      "hover:bg-secondary/40",
      isSelected
        ? "bg-primary/5 border-primary/10 shadow-sm"
        : "bg-transparent"
    )}
  >
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
          isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
        )}
      >
        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground shadow-sm" />}
      </div>

      {sizeColour.productPics && (
        <div className="w-8 h-8 rounded-md overflow-hidden border border-border/50 shrink-0">
          <img src={sizeColour.productPics} alt={sizeColour.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex flex-col">
        <span className={cn("text-sm font-medium leading-none transition-colors", isSelected ? "text-foreground font-semibold" : "text-foreground/80")}>
          {sizeColour.name}
        </span>
      </div>
    </div>
    <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-primary" : "text-muted-foreground")}>
      +₹{sizeColour.price}
    </span>
  </div >
);


const AddToCartContent = ({
  product,
  close,
  onAddToCart,
}: {
  product: ProductWithImage;
  close: () => void;
  onAddToCart?: () => void;
}) => {
  const { addToCart, setCartOpen } = useCart();
  const { toast } = useToast();

  console.log('AddToCartContent Product:', product);
  console.log('Colors:', product.colors);
  console.log('Pricing/SizeColours:', product.pricing);

  // -- State Logic --
  const [selectedVariants, setSelectedVariants] = React.useState<Record<string, string>>(() => {
    const initialState: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach((variant) => {
        initialState[variant.name] = variant.options[0];
      });
    }
    return initialState;
  });

  const [selectedPricingId, setSelectedPricingId] = React.useState<string>(
    product.pricing && product.pricing.length > 0 ? product.pricing[0].id : ""
  );

  const [selectedSizeColourIds, setSelectedSizeColourIds] = React.useState<Set<string>>(new Set());

  const [selectedColourId, setSelectedColourId] = React.useState<string>(
    product.colors && product.colors.length > 0 ? product.colors[0].id : ""
  );

  const selectedPricingOption = product.pricing?.find(p => p.id === selectedPricingId);
  const availableSizeColours = selectedPricingOption?.sizeColours || [];

  React.useEffect(() => {
    // Default select the first size colour if available (Mandatory)
    if (availableSizeColours.length > 0) {
      setSelectedSizeColourIds(new Set([availableSizeColours[0].id]));
    } else {
      setSelectedSizeColourIds(new Set());
    }
  }, [selectedPricingId, availableSizeColours.length]); // Dependencies updated

  const basePrice = selectedPricingOption ? selectedPricingOption.price : product.price;
  const sizeColoursPrice = availableSizeColours
    .filter(sc => selectedSizeColourIds.has(sc.id))
    .reduce((acc, sc) => acc + sc.price, 0);

  const currentPrice = basePrice + sizeColoursPrice;

  // -- Handlers --
  const handleVariantChange = (variantName: string, option: string) => {
    setSelectedVariants((prev) => ({ ...prev, [variantName]: option }));
  };

  const handleSizeColourToggle = (scId: string) => {
    setSelectedSizeColourIds(prev => {
      // Single selection, mandatory (cannot deselect the only one, but clicking another switches)
      // Actually user says "mandatory to click on add to cart", implies we should just switch.
      // If we click the same one, do nothing or keep it selected.
      return new Set([scId]);
    });
  };

  const handleAddToCart = () => {
    const variantsToAdd = { ...selectedVariants };
    if (selectedPricingOption) {
      variantsToAdd['Quantity'] = selectedPricingOption.quantity;
    }
    const selectedSizeColoursList = availableSizeColours.filter(a => selectedSizeColourIds.has(a.id));

    // Calculate effective price: Mirror ProductCard logic (Calc Percentage -> PriceAfterDiscount -> Base)
    // 1. Resolve base price for this variant
    const variantPrice = selectedPricingOption ? selectedPricingOption.price : product.price;

    // 2. Resolve discount logic
    let effectiveBasePrice = variantPrice;

    const offerPercent = product.productOffer ? parseFloat(product.productOffer.toString().replace(/[^0-9.]/g, '')) : 0;

    // Condition A: Explicit Variant Discount (Priority 1)
    if (selectedPricingOption && selectedPricingOption.priceAfterDiscount && selectedPricingOption.priceAfterDiscount > 0) {
      effectiveBasePrice = selectedPricingOption.priceAfterDiscount;
    }
    // Condition B: Percentage Offer exists (and variant price matches base product price) (Priority 2)
    else if (offerPercent > 0 && variantPrice === product.price) {
      const discountAmount = (variantPrice * offerPercent) / 100;
      effectiveBasePrice = Math.round(variantPrice - discountAmount);
    }
    // Condition C: Explicit Product Discount (fallback)
    else if (product.priceAfterDiscount && product.priceAfterDiscount > 0) {
      // Only apply if it makes sense (e.g. less than current variant price)
      if (product.priceAfterDiscount < variantPrice) {
        effectiveBasePrice = product.priceAfterDiscount;
      }
    }




    // Resolve selected colour object
    const selectedColour = product.colors?.find(c => c.id === selectedColourId);
    const colourToAdd = selectedColour ? {
      id: selectedColour.id,
      name: selectedColour.name,
      image: selectedColour.image || ''
    } : undefined;

    addToCart(
      { ...product, price: variantPrice, priceAfterDiscount: effectiveBasePrice, productSizeId: selectedPricingId },
      variantsToAdd,
      selectedSizeColoursList,
      colourToAdd
    );

    // Trigger success confetti
    const triggerConfetti = () => {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#D4AF37', '#FDE68A', '#F59E0B', '#B45309', '#FEF3C7'],
        zIndex: 9999
      };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    };

    triggerConfetti();

    close();

    // Small delay to ensure the AddToCartSheet closes completely before opening the CartSheet
    setTimeout(() => {
      setCartOpen(true);
      if (onAddToCart) onAddToCart();
    }, 300);
  };

  const hasVariants = (product.variants && product.variants.length > 0) || (product.pricing && product.pricing.length > 0) || (product.colors && product.colors.length > 0);

  // -- Render Content --

  return (
    <div className="flex flex-col h-full bg-background relative group/sheet">
      {/* Header - Compact Text Only */}
      <div className="flex flex-col p-5 pb-2 shrink-0 relative border-b border-border/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 pr-8">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{product.name}</h2>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 rounded-full hover:bg-secondary text-muted-foreground"
            onClick={close}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 px-4 min-h-0 overflow-y-auto overscroll-contain pt-2 pb-6">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* Quantity Selector */}
          {product.pricing && product.pricing.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Select Size/Quantity</h3>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Required</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(() => {
                  const prices = product.pricing.map(p => p.price);
                  // Check if all prices are the same (using a simple strict equality check against the first item)
                  const allPricesSame = prices.every(p => p === prices[0]);

                  return product.pricing.map((option) => {
                    // Logic: Mirror ProductCard logic for consistent display
                    let finalOptionPrice = option.price;
                    const offerPercent = product.productOffer ? parseFloat(product.productOffer.toString().replace(/[^0-9.]/g, '')) : 0;

                    if (offerPercent > 0 && option.price === product.price) {
                      const discountAmount = (option.price * offerPercent) / 100;
                      finalOptionPrice = Math.round(option.price - discountAmount);
                    }
                    else if (option.priceAfterDiscount && option.priceAfterDiscount > 0) {
                      finalOptionPrice = option.priceAfterDiscount;
                    }
                    else if (option.price === product.price && product.priceAfterDiscount && product.priceAfterDiscount > 0) {
                      finalOptionPrice = product.priceAfterDiscount;
                    }

                    const hasOffer = finalOptionPrice < option.price;



                    const isActive = option.sizeStatus !== 'INACTIVE' && option.sizeStatus !== 'OUTOFSTOCK';
                    const statusLabel = option.sizeStatus === 'OUTOFSTOCK' ? 'Sold Out' : (option.sizeStatus === 'INACTIVE' ? 'Unavailable' : undefined);

                    return (
                      <OptionCard
                        key={option.id}
                        label={option.quantity}
                        active={isActive}
                        statusLabel={statusLabel}
                        subLabel={
                          !allPricesSame && isActive ? (
                            <div className="flex flex-col items-center leading-none">
                              {hasOffer && (
                                <span className="text-[9px] line-through opacity-70 mb-0.5">₹{option.price}</span>
                              )}
                              <span className="text-[11px] font-bold">₹{finalOptionPrice.toFixed(0)}</span>
                            </div>
                          ) : undefined
                        }
                        isSelected={selectedPricingId === option.id}
                        onClick={() => setSelectedPricingId(option.id)}
                      />
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {availableSizeColours.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Select</h3>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-secondary/50 px-2 py-1 rounded">Required</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {availableSizeColours.map(sc => {
                  const isActive = sc.sizeColourStatus !== 'INACTIVE' && sc.sizeColourStatus !== 'OUTOFSTOCK';
                  return (
                    <ColourCard
                      key={sc.id}
                      name={sc.name}
                      // @ts-ignore - Check for multiple possible image fields
                      image={sc.productPics || sc.image}
                      active={isActive}
                      statusLabel={sc.sizeColourStatus === 'OUTOFSTOCK' ? 'Sold Out' : undefined}
                      isSelected={selectedSizeColourIds.has(sc.id)}
                      onClick={() => handleSizeColourToggle(sc.id)}
                      extraPrice={sc.price}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Colour Selector */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Select</h3>
                {/* <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Optional</span> */}
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
                      active={isActive}
                      statusLabel={statusLabel}
                      isSelected={selectedColourId === colour.id}
                      onClick={() => setSelectedColourId(colour.id)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Legacy Variants */}
          {product.variants && product.variants.map((variant) => (
            <div key={variant.name} className="space-y-2.5">
              <h3 className="text-sm font-semibold">Select {variant.name}</h3>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((option) => (
                  <Button
                    key={option}
                    variant={selectedVariants[variant.name] === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleVariantChange(variant.name, option)}
                    className={cn(
                      "rounded-full px-3 h-7 text-xs",
                      selectedVariants[variant.name] === option ? "shadow-sm" : "bg-transparent"
                    )}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          ))}

          {!hasVariants && (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No customization options available.</p>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 p-4 bg-background border-t z-10 safe-area-inset-bottom">
        <div className="flex items-center gap-4 w-full">
          <div className="flex flex-col min-w-[25%] shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Total</span>
            {(() => {
              const variantPrice = selectedPricingOption ? selectedPricingOption.price : product.price;
              let effectiveBase = variantPrice;

              const offerPercent = product.productOffer ? parseFloat(product.productOffer.toString().replace(/[^0-9.]/g, '')) : 0;

              if (offerPercent > 0 && variantPrice === product.price) {
                const discountAmount = (variantPrice * offerPercent) / 100;
                effectiveBase = Math.round(variantPrice - discountAmount);
              }
              else if (selectedPricingOption && selectedPricingOption.priceAfterDiscount && selectedPricingOption.priceAfterDiscount > 0) {
                effectiveBase = selectedPricingOption.priceAfterDiscount;
              }
              else if (product.priceAfterDiscount && product.priceAfterDiscount > 0) {
                if (product.priceAfterDiscount < variantPrice) {
                  effectiveBase = product.priceAfterDiscount;
                }
              }

              const finalPrice = effectiveBase + sizeColoursPrice;
              const hasOffer = finalPrice < currentPrice;

              return (
                <div className="flex flex-col items-start leading-none">
                  {hasOffer && (
                    <span className="text-[10px] text-muted-foreground line-through font-medium mb-0.5">₹{currentPrice.toFixed(0)}</span>
                  )}
                  <span className="text-xl font-black text-primary leading-none tracking-tight">₹{finalPrice.toFixed(0)}</span>
                </div>
              );
            })()}
          </div>
          {(() => {
            const selectedColour = product.colors?.find(c => c.id === selectedColourId);
            const isSelectedColourOOS = selectedColour && (selectedColour.colourStatus === 'OUTOFSTOCK' || selectedColour.colourStatus === 'INACTIVE');

            const selectedSizeColoursList = availableSizeColours.filter(a => selectedSizeColourIds.has(a.id));
            const isSelectedSizeColourOOS = selectedSizeColoursList.some(sc => sc.sizeColourStatus === 'OUTOFSTOCK' || sc.sizeColourStatus === 'INACTIVE');

            const isOutOfStock = product.productStatus === 'OUTOFSTOCK' ||
              (selectedPricingOption?.sizeStatus === 'OUTOFSTOCK' || selectedPricingOption?.sizeStatus === 'INACTIVE') ||
              isSelectedColourOOS ||
              isSelectedSizeColourOOS;

            return (
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  "flex-1 rounded-xl shadow-xl shadow-primary/10 text-sm font-bold h-12 transition-all duration-300 active:scale-95",
                  isOutOfStock ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none" : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isOutOfStock ? "Out of Stock" : (
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="uppercase tracking-wider">Add to Bag</span>
                  </div>
                )}
              </Button>
            );
          })()}
        </div>
      </div>

    </div>
  );
};

// --- Desktop Version (Popover) ---




// --- Main Component ---

interface AddToCartSheetProps {
  product: ProductWithImage;
  children: React.ReactNode;
  onAddToCart?: () => void;
}

export function AddToCartSheet({ product, children, onAddToCart }: AddToCartSheetProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const { addToCart, setCartOpen } = useCart();
  const { toast } = useToast();
  const { theme } = useTenant();
  const productCard = theme?.productCard;
  const hasVariants = (product.variants && product.variants.length > 0) || (product.pricing && product.pricing.length > 0) || (product.colors && product.colors.length > 0);

  // Handle back button on mobile
  useSheetBackHandler(open, setOpen);

  const handleSimpleAddToCart = (e: React.MouseEvent) => {
    if (hasVariants) return;
    e.stopPropagation();
    e.preventDefault();

    // Calculate effective price for simple product
    let effectivePrice = product.price;

    // Priority 1: Explicit Price After Discount
    if (product.priceAfterDiscount && product.priceAfterDiscount > 0 && product.priceAfterDiscount < product.price) {
      effectivePrice = product.priceAfterDiscount;
    }
    // Priority 2: Product Offer Percentage
    else {
      const offerPercent = product.productOffer ? parseFloat(product.productOffer.toString().replace(/[^0-9.]/g, '')) : 0;
      if (offerPercent > 0) {
        const discountAmount = (product.price * offerPercent) / 100;
        effectivePrice = Math.round(product.price - discountAmount);
      }
    }

    if (product.productStatus === 'OUTOFSTOCK') {
      toast({
        title: "Out of Stock",
        description: "This product is currently unavailable.",
        variant: "destructive",
      });
      return;
    }

    addToCart({ ...product, price: product.price, priceAfterDiscount: effectivePrice }, {});

    // Trigger success confetti
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#D4AF37', '#FDE68A', '#F59E0B', '#B45309', '#FEF3C7'],
      zIndex: 9999
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });


    // Small delay for smooth transition and ensuring state updates don't conflict
    setTimeout(() => {
      setCartOpen(true);
      // Trigger optional callback
      if (onAddToCart) onAddToCart();
    }, 100);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  }

  if (!hasVariants) {
    return <div onClick={handleSimpleAddToCart}>{children}</div>;
  }

  const trigger = React.cloneElement(children as React.ReactElement<any>, { onClick: handleTriggerClick });

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetPrimitive.Portal>
            <SheetPrimitive.Overlay
              className="fixed inset-0 z-[99] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            />
            <SheetPrimitive.Content
              className={cn(
                "fixed z-[100] gap-0 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
                "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                "rounded-t-[24px] p-0 h-[85vh] md:h-auto flex flex-col overflow-hidden shadow-2xl [&>button]:hidden px-safe"
              )}
              style={{
                border: productCard?.border,
                borderBottom: 'none',
                borderRadius: `${productCard?.radius || '20px'} ${productCard?.radius || '20px'} 0 0`
              }}
            >
              <div className="h-full w-full">
                <AddToCartContent product={product} close={() => setOpen(false)} onAddToCart={onAddToCart} />
              </div>
            </SheetPrimitive.Content>
          </SheetPrimitive.Portal>
        </Sheet>
      </>
    );
  }

  // Desktop Popover - Beside the card
  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="right"
        align="center"
        sideOffset={16}
        className="w-[340px] p-0 overflow-hidden shadow-2xl shadow-black/20 h-[450px] flex flex-col bg-background"
        style={{
          border: productCard?.border,
          borderRadius: productCard?.radius || '1rem'
        }}
      >
        {/* Passing close prop correctly as it is used in AddToCartContent */}
        {/* AddToCartContent needs to be wrapped in a way that it fills height but respects max-height */}
        <AddToCartContent product={product} close={() => setOpen(false)} onAddToCart={onAddToCart} />
      </PopoverContent>
    </Popover>
  );
}
