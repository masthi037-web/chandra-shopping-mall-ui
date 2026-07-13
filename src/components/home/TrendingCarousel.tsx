'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ProductWithImage } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TrendingCarouselProps {
    products: ProductWithImage[];
}

// Curated high-quality, lightweight, vertical fashion video previews from Pexels (wedding/ethnic wear)
const FALLBACK_VIDEOS = [
    "https://videos.pexels.com/video-files/5385871/5385871-sd_360_640_25fps.mp4", // Indian bridal fashion
    "https://videos.pexels.com/video-files/6985472/6985472-sd_360_640_25fps.mp4", // Saree / Lehenga model
    "https://videos.pexels.com/video-files/6985458/6985458-sd_360_640_25fps.mp4", // Wedding gown details
    "https://videos.pexels.com/video-files/3882772/3882772-sd_360_640_25fps.mp4", // Traditional wear model posing
    "https://videos.pexels.com/video-files/6985532/6985532-sd_360_640_25fps.mp4"  // Lehenga rotation draping
];

export function TrendingCarousel({ products }: TrendingCarouselProps) {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    // Filter or build a solid list of trending/sale items
    // We want at least 5 items for a perfect 3D stack. Fallback to all if not enough on sale.
    const saleProducts = React.useMemo(() => {
        const filtered = products.filter(
            (p) => p.famous || (p.productOffer && String(p.productOffer) !== "0") || (p.priceAfterDiscount && p.priceAfterDiscount < p.price)
        );
        const list = filtered.length >= 5 ? filtered : products;
        
        // Map videos onto the products
        return list.slice(0, 10).map((product, i) => ({
            ...product,
            videoUrl: FALLBACK_VIDEOS[i % FALLBACK_VIDEOS.length]
        }));
    }, [products]);

    const total = saleProducts.length;

    // Control video playback based on active slide
    useEffect(() => {
        if (total === 0) return;

        videoRefs.current.forEach((video, idx) => {
            if (!video) return;
            if (idx === activeIndex) {
                // Play active video
                video.currentTime = 0;
                video.play().catch((err) => {
                    // Safe catch for autoplay restrictions
                    console.log("Autoplay caught:", err.message);
                });
            } else {
                // Pause and reset other videos
                video.pause();
            }
        });
    }, [activeIndex, total]);

    if (total === 0) return null;

    const nextSlide = () => {
        setActiveIndex((prev) => (prev + 1) % total);
    };

    const prevSlide = () => {
        setActiveIndex((prev) => (prev - 1 + total) % total);
    };

    const handleCardClick = (index: number) => {
        if (index === activeIndex) {
            // Click active card to view product details
            router.push(`/product/${saleProducts[index].id}`);
        } else {
            // Click side card to bring it to center
            setActiveIndex(index);
        }
    };

    return (
        <div className="w-full py-8 space-y-8 bg-transparent">
            {/* Section Header Card */}
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center justify-center text-center py-8 px-6 rounded-2xl bg-[#faf7f2]/90 border border-[#eadeca]/50 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#aa5e50]">Video Shopping</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-[#5445a0] tracking-tight leading-tight uppercase font-headline">
                        Trending Styles <span className="text-[#aa5e50]">On SALE</span>
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-md text-xs sm:text-sm">
                        Tap the videos to play, view designer details, and explore hot arrivals.
                    </p>
                </div>
            </div>

            {/* 3D Stack Slider Container Card */}
            <div className="container mx-auto px-4">
                <div className="relative flex items-center justify-center h-[520px] md:h-[580px] w-full max-w-5xl mx-auto rounded-3xl bg-[#faf7f2]/90 border border-[#eadeca]/50 shadow-sm py-6 px-4 md:px-8 backdrop-blur-md">
                    
                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 md:left-8 z-40 p-3 rounded-full bg-background hover:bg-secondary border border-border shadow-lg text-foreground hover:scale-105 transition-all select-none"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-4 md:right-8 z-40 p-3 rounded-full bg-background hover:bg-secondary border border-border shadow-lg text-foreground hover:scale-105 transition-all select-none"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Cards Stack */}
                    <div className="relative flex items-center justify-center w-full h-full">
                        {saleProducts.map((product, index) => {
                            // Calculate 3D offset distance from active center index
                            let offset = index - activeIndex;

                            // Handle wrapping
                            if (offset < -Math.floor(total / 2)) offset += total;
                            if (offset > Math.floor(total / 2)) offset -= total;

                            const isActive = offset === 0;
                            const isVisible = Math.abs(offset) <= 2;

                            if (!isVisible) return null;

                            return (
                                <div
                                    key={product.id}
                                    onClick={() => handleCardClick(index)}
                                    style={{
                                        transform: `translateX(${offset * 110}px) scale(${1 - Math.abs(offset) * 0.12})`,
                                        zIndex: 30 - Math.abs(offset),
                                    }}
                                    className={cn(
                                        "absolute w-[220px] sm:w-[250px] md:w-[285px] h-[360px] sm:h-[400px] md:h-[450px] rounded-2xl overflow-hidden cursor-pointer shadow-xl transition-all duration-500 ease-in-out border border-border/25 bg-card flex flex-col group select-none",
                                        isActive ? "shadow-primary/10 shadow-2xl scale-105" : "opacity-60 md:opacity-85 pointer-events-auto filter blur-[0.5px] hover:opacity-100"
                                    )}
                                >
                                    {/* Media Section (Image or Video) */}
                                    <div className="relative flex-1 w-full h-full overflow-hidden bg-muted">
                                        
                                        {/* Image (Always mounted as cover / fallback) */}
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className={cn(
                                                "absolute inset-0 w-full h-full object-cover transition-transform duration-700",
                                                isActive ? "group-hover:scale-105" : ""
                                            )}
                                        />

                                        {/* Video (Autoplay when active/centered) */}
                                        {isActive && product.videoUrl && (
                                            <video
                                                ref={(el) => {
                                                    videoRefs.current[index] = el;
                                                }}
                                                src={product.videoUrl}
                                                loop
                                                muted={isMuted}
                                                playsInline
                                                className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300"
                                            />
                                        )}

                                        {/* Offer Badge */}
                                        {product.productOffer && (
                                            <div className="absolute top-3 left-3 z-20 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                                                {product.productOffer} OFF
                                            </div>
                                        )}

                                        {/* Audio Toggle (Only shown on active center video card) */}
                                        {isActive && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Avoid triggering route
                                                    setIsMuted(!isMuted);
                                                }}
                                                className="absolute bottom-3 right-3 z-20 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                                            >
                                                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                    </div>

                                    {/* Product Meta Overlay (Matches Kalki design) */}
                                    <div className="p-4 bg-background border-t border-border/30 flex flex-col justify-between shrink-0">
                                        <h3 className="text-xs md:text-sm font-semibold text-foreground line-clamp-1 leading-tight tracking-tight mb-1 text-center font-display uppercase">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <span className="text-xs md:text-sm font-bold text-foreground">
                                                ₹{product.priceAfterDiscount || product.price}
                                            </span>
                                            {product.priceAfterDiscount && product.priceAfterDiscount < product.price && (
                                                <span className="text-[10px] md:text-xs text-muted-foreground line-through opacity-70">
                                                    ₹{product.price}
                                                </span>
                                            )}
                                        </div>

                                        {/* View Details Button (Visible on active center card) */}
                                        {isActive && (
                                            <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <button
                                                    onClick={() => router.push(`/product/${product.id}`)}
                                                    className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest rounded-md transition-all shadow-md mt-1"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
