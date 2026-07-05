'use client';

import React from 'react';
import { ShieldCheck, Truck, Sparkles } from 'lucide-react';

export function FeaturesCarousel({ features }: { features?: any[] }) {
  const items = [
    { icon: ShieldCheck, text: "100% Authentic Handloom", color: "text-rose-500" },
    { icon: Truck, text: "Artisanal Express Delivery", color: "text-[#c29f8a]" },
    { icon: Sparkles, text: "Handcrafted by 17,000+ Artisans", color: "text-amber-500" }
  ];

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#fcfbf9] via-[#f5f1e6] to-[#fcfbf9] py-3.5 border-y border-[#e8e4db] shadow-sm transform -skew-y-1 md:-skew-y-0.5 scale-102 my-6 select-none">
      <style>{`
        .features-ticker-wrapper {
          display: flex;
          width: max-content;
          animation: features-ticker-scroll 25s linear infinite;
        }
        .features-ticker-wrapper:hover {
          animation-play-state: paused;
        }
        .features-ticker-group {
          display: flex;
          align-items: center;
          gap: 3rem;
          padding-right: 3rem;
          flex-shrink: 0;
        }
        @keyframes features-ticker-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
      <div className="features-ticker-wrapper">
        {[1, 2].map((groupNum) => (
          <div key={groupNum} className="features-ticker-group">
            {[1, 2, 3].map((repNum) => (
              <React.Fragment key={repNum}>
                {items.map((item, idx) => (
                  <div key={`${groupNum}-${repNum}-${idx}`} className="flex items-center gap-2.5 text-[10px] md:text-[11px] font-serif tracking-[0.25em] uppercase text-[#2a2a2a] whitespace-nowrap">
                    <item.icon className={`w-4 h-4 ${item.color}`} strokeWidth={1.5} />
                    <span>{item.text}</span>
                    <span className="text-[#c29f8a] text-xs ml-3">✦</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

