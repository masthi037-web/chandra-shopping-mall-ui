"use client";

import React from 'react';

export function BoutiqueBackground() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-gradient-to-tr from-[#faf8f5] via-[#fcfbf9] to-[#faf8f5] dark:from-[#111827] dark:via-[#1f2937] dark:to-[#111827]">
      <style>{`
        .boutique-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          mix-blend-mode: multiply;
          animation: float-around 25s ease-in-out infinite alternate;
        }
        .boutique-orb-1 {
          width: 45vw;
          height: 45vw;
          background: radial-gradient(circle, #eada3c 0%, rgba(234, 218, 60, 0) 70%);
          top: -10%;
          left: -10%;
          animation-duration: 35s;
        }
        .boutique-orb-2 {
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, #c29f8a 0%, rgba(194, 159, 138, 0) 70%);
          bottom: -15%;
          right: -10%;
          animation-duration: 40s;
          animation-delay: -5s;
        }
        .boutique-orb-3 {
          width: 35vw;
          height: 35vw;
          background: radial-gradient(circle, #e8e4db 0%, rgba(232, 228, 219, 0) 70%);
          top: 40%;
          right: 15%;
          animation-duration: 30s;
          animation-delay: -10s;
        }
        @keyframes float-around {
          0% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
          50% {
            transform: translate3d(5vw, 8vh, 0) scale(1.15) rotate(180deg);
          }
          100% {
            transform: translate3d(-3vw, -5vh, 0) scale(0.9) rotate(360deg);
          }
        }
        .dark .boutique-orb {
          opacity: 0.08;
          mix-blend-mode: screen;
        }
      `}</style>
      <div className="boutique-orb boutique-orb-1" />
      <div className="boutique-orb boutique-orb-2" />
      <div className="boutique-orb boutique-orb-3" />
    </div>
  );
}