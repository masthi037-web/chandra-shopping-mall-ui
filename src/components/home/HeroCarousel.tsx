'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaItem {
    url: string;
    type: 'image' | 'video';
}

interface HeroCarouselProps {
    media: MediaItem[];
    autoPlayInterval?: number;
}

export function HeroCarousel({ media, autoPlayInterval = 6000 }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const nextSlide = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev + 1) % media.length);
        setTimeout(() => setIsTransitioning(false), 1000);
    }, [media.length, isTransitioning]);

    const prevSlide = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
        setTimeout(() => setIsTransitioning(false), 1000);
    }, [media.length, isTransitioning]);

    useEffect(() => {
        if (media.length <= 1) return;
        const interval = setInterval(nextSlide, autoPlayInterval);
        return () => clearInterval(interval);
    }, [nextSlide, autoPlayInterval, media.length]);

    if (!media || media.length === 0) return null;

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            {media.map((item, index) => (
                <div
                    key={`${item.url}-${index}`}
                    className={cn(
                        "absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out transform",
                        index === currentIndex 
                            ? "opacity-100 scale-105 z-10" 
                            : "opacity-0 scale-110 z-0"
                    )}
                >
                    {item.type === 'video' ? (
                        <video
                            src={item.url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover object-center"
                        />
                    ) : (
                        <Image
                            src={item.url}
                            alt="Hero Banner"
                            fill
                            className="object-cover object-center"
                            priority={index === 0}
                        />
                    )}
                </div>
            ))}

            {/* Navigation Dots */}
            {media.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                    {media.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-300",
                                index === currentIndex 
                                    ? "bg-primary w-8" 
                                    : "bg-white/40 hover:bg-white/60"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Optional Arrows for Accessibility/UX */}
            {media.length > 1 && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex justify-between px-4 md:px-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={prevSlide}
                        className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 hover:bg-black/40 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 hover:bg-black/40 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            )}
        </div>
    );
}
