"use client";

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

export function ClientBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const [vantaLoaded, setVantaLoaded] = useState(false);

  useEffect(() => {
    if (threeLoaded && vantaLoaded && vantaRef.current && !vantaEffect) {
      try {
        const effect = window.VANTA.FOG({
          el: vantaRef.current,
          THREE: window.THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          highlightColor: 0xd7bd81,
          midtoneColor: 0xaa5e50,
          lowlightColor: 0x5445a0,
          blurFactor: 0.54,
          speed: 2.40,
          zoom: 0.60
        });
        setVantaEffect(effect);
      } catch (err) {
        console.error("Vanta initialization failed:", err);
      }
    }

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, [threeLoaded, vantaLoaded, vantaEffect]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        strategy="lazyOnload"
        onLoad={() => setThreeLoaded(true)}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js"
        strategy="lazyOnload"
        onLoad={() => setVantaLoaded(true)}
      />
      <div
        ref={vantaRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      />
    </>
  );
}