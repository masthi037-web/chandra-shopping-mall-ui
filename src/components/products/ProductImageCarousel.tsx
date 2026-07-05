"use client";

import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ProductImageCarouselProps {
    images: string[];
    alt: string;
}

export function ProductImageCarousel({ images, alt }: ProductImageCarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
    const [nextBtnDisabled, setNextBtnDisabled] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
    const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
        setPrevBtnDisabled(!emblaApi.canScrollPrev());
        setNextBtnDisabled(!emblaApi.canScrollNext());
    }, [emblaApi, setSelectedIndex]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    // Handle single image gracefully
    if (images.length <= 1) {
        return (
            <div className="relative w-full h-full bg-gradient-to-br from-neutral-50 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950 rounded-2xl sm:rounded-3xl shadow-inner border border-black/5 dark:border-white/5 overflow-hidden flex items-center justify-center p-4">
                <TransformWrapper centerZoomedOut={true} wheel={{ wheelDisabled: true }}>
                    {({ resetTransform }) => (
                        <div
                            className="w-full h-full relative"
                            onMouseLeave={() => resetTransform()}
                            onTouchEnd={() => setTimeout(() => resetTransform(), 1000)}
                        >
                            <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full relative flex items-center justify-center">
                                <Image src={images[0] || ''} alt={alt} fill priority className="object-contain p-2 sm:p-6 drop-shadow-xl" />
                            </TransformComponent>
                        </div>
                    )}
                </TransformWrapper>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full group bg-gradient-to-br from-neutral-50 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950 rounded-2xl sm:rounded-3xl shadow-inner border border-black/5 dark:border-white/5 overflow-hidden">
            <div className="overflow-hidden w-full h-full" ref={emblaRef}>
                <div className="flex w-full h-full backface-hidden">
                    {images.map((src, index) => (
                        <div className="relative flex-[0_0_100%] min-w-0 h-full p-4 sm:p-8 flex items-center justify-center" key={index}>
                            <TransformWrapper centerZoomedOut={true} wheel={{ wheelDisabled: true }}>
                                {({ resetTransform }) => (
                                    <div
                                        className="w-full h-full relative"
                                        onMouseLeave={() => resetTransform()}
                                        onTouchEnd={() => setTimeout(() => resetTransform(), 1000)}
                                    >
                                        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full relative flex items-center justify-center">
                                            <Image
                                                src={src || ''}
                                                alt={`${alt} - Image ${index + 1}`}
                                                fill
                                                priority
                                                className="object-contain p-4 sm:p-8 drop-shadow-xl"
                                            />
                                        </TransformComponent>
                                    </div>
                                )}
                            </TransformWrapper>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows */}
            <Button
                variant="secondary"
                size="icon"
                className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background backdrop-blur-sm z-10 text-foreground",
                    prevBtnDisabled && "opacity-50 cursor-not-allowed group-hover:opacity-50"
                )}
                onClick={scrollPrev}
                disabled={prevBtnDisabled}
                aria-label="Previous image"
            >
                <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
                variant="secondary"
                size="icon"
                className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background backdrop-blur-sm z-10 text-foreground",
                    nextBtnDisabled && "opacity-50 cursor-not-allowed group-hover:opacity-50"
                )}
                onClick={scrollNext}
                disabled={nextBtnDisabled}
                aria-label="Next image"
            >
                <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Pagination Dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            selectedIndex === index ? "bg-primary w-4" : "bg-primary/40 hover:bg-primary/60"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
