'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProductImageZoomProps {
  images: string[];
  alt: string;
}

export default function ProductImageZoom({ images, alt }: ProductImageZoomProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);

  const activeImage = images[activeIndex] || images[0] || '';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div className="flex flex-row w-full h-full select-none">
      {/* Vertical Thumbnails List on Left */}
      {images.length > 1 && (
        <div className="flex flex-col gap-3 mr-3 w-16 md:w-20 shrink-0 h-[480px] overflow-y-auto scrollbar-none pr-1">
          {images.map((imgSrc, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative aspect-[3/4] w-full rounded-lg overflow-hidden border bg-[#fbfbfa] transition-all duration-300",
                activeIndex === idx
                  ? "border-[#c29f8a] shadow-sm ring-1 ring-[#c29f8a]/30"
                  : "border-[#e8e4db] hover:border-[#c29f8a]/50"
              )}
            >
              <img
                src={imgSrc}
                alt={`${alt} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Active Image Display with Hover Zoom */}
      <div 
        className="flex-1 relative aspect-[3/4] overflow-hidden rounded-2xl border border-[#e8e4db]/80 bg-[#fcfbf9] cursor-zoom-in"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => {
          setIsZoomed(false);
          setZoomPos({ x: 50, y: 50 });
        }}
      >
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
          <img
            src={activeImage}
            alt={alt}
            style={{
              transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            }}
            className="w-full h-full object-cover transition-transform duration-200 ease-out"
          />
        </div>

        {/* Small zoom indicator */}
        {isZoomed && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] px-2.5 py-1 rounded-full font-sans tracking-wide pointer-events-none uppercase shadow-md animate-in fade-in duration-300">
            Hover to magnify
          </div>
        )}
      </div>
    </div>
  );
}