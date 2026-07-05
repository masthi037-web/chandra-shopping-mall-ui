'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionDividerProps {
    className?: string;
    color?: string; // Optional custom color hex (e.g. #C29F8A)
}

export default function SectionDivider({ className, color }: SectionDividerProps) {
    // Generate a unique ID for the pattern to avoid conflicts on the page
    const patternId = React.useId().replace(/:/g, '');

    // Default warm sand/gold-beige color for fashion theme if none provided
    const strokeColor = color || '#C29F8A';

    return (
        <div className={cn("w-full flex items-center justify-center my-6 py-2 overflow-hidden select-none pointer-events-none", className)}>
            <svg 
                className="w-full h-8 opacity-80" 
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="32"
            >
                <defs>
                    <pattern 
                        id={`lace-divider-${patternId}`} 
                        width="36" 
                        height="24" 
                        patternUnits="userSpaceOnUse"
                        x="50%"
                    >
                        <animateTransform 
                            attributeName="patternTransform" 
                            type="translate" 
                            from="0,0" 
                            to="-36,0" 
                            dur="5s" 
                            repeatCount="indefinite" 
                        />
                        {/* Elegant interlocking loops/infinity flourish matching image1 */}
                        <path 
                            d="M 0 12 C 9 3, 9 21, 18 12 C 27 3, 27 21, 36 12" 
                            fill="none" 
                            stroke={strokeColor} 
                            strokeWidth="1.25"
                            strokeLinecap="round"
                        />
                        <path 
                            d="M 0 12 C 9 21, 9 3, 18 12 C 27 21, 27 3, 36 12" 
                            fill="none" 
                            stroke={strokeColor} 
                            strokeWidth="1.25"
                            strokeLinecap="round"
                        />
                        {/* Dot markers at loop nodes */}
                        <circle cx="9" cy="6.5" r="1.25" fill={strokeColor} />
                        <circle cx="9" cy="17.5" r="1.25" fill={strokeColor} />
                        <circle cx="27" cy="6.5" r="1.25" fill={strokeColor} />
                        <circle cx="27" cy="17.5" r="1.25" fill={strokeColor} />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#lace-divider-${patternId})`} />
            </svg>
        </div>
    );
}
