import React from 'react';

interface KhetNetLogoProps {
  className?: string;
}

export function KhetNetLogo({ className = "w-12 h-12" }: KhetNetLogoProps) {
  return (
    <div className={`relative ${className} overflow-hidden rounded-[25%] p-1 shadow-inner bg-white border-2 border-[#E2F0D9]`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#E0F7FA" />
          </linearGradient>
        </defs>
        <rect width="100" height="60" fill="url(#skyGrad)" />
        
        <circle cx="20" cy="20" r="8" fill="white" fillOpacity="0.6" />
        <circle cx="30" cy="25" r="10" fill="white" fillOpacity="0.4" />
        <circle cx="80" cy="15" r="7" fill="white" fillOpacity="0.5" />
        
        <path d="M0 60 Q 50 45 100 60 V100 H0 Z" fill="#4C6B36" />
        <path d="M0 75 Q 50 65 100 75 V100 H0 Z" fill="#5D8242" />
        <path d="M0 85 Q 50 80 100 85 V100 H0 Z" fill="#6E994E" />
        
        <path d="M20 100 Q 30 70 60 60" stroke="#D2B48C" strokeWidth="6" fill="none" />
        
        <g transform="translate(45, 55) scale(0.6)">
          <rect x="10" y="15" width="40" height="20" fill="#E53935" rx="2" />
          <rect x="15" y="5" width="20" height="15" fill="#E53935" rx="1" />
          <rect x="18" y="7" width="14" height="10" fill="#BBDEFB" />
          <path d="M45 15 V5" stroke="black" strokeWidth="2" />
          <circle cx="15" cy="35" r="10" fill="#212121" />
          <circle cx="15" cy="35" r="5" fill="#757575" />
          <circle cx="45" cy="38" r="7" fill="#212121" />
          <circle cx="45" cy="38" r="3" fill="#757575" />
        </g>
      </svg>
    </div>
  );
}
