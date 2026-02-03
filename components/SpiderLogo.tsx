
import React from 'react';

interface SpiderLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

const SpiderLogo: React.FC<SpiderLogoProps> = ({ size = 24, className = "", glow = true }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_8px_rgba(0,210,255,0.8)]' : ''}`}
    >
      <defs>
        <filter id="spiderGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <g stroke="#00d2ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#spiderGlow)">
        {/* Body - Geometric Diamond */}
        <path d="M16 12L13 16L16 20L19 16L16 12Z" fill="#00d2ff" fillOpacity="0.3" />
        
        {/* Left Legs */}
        <path d="M13 14L6 6L2 10" />
        <path d="M12 16L4 16L1 19" />
        <path d="M12 17L5 24L2 22" />
        <path d="M14 19L10 30L5 30" />
        
        {/* Right Legs */}
        <path d="M19 14L26 6L30 10" />
        <path d="M20 16L28 16L31 19" />
        <path d="M20 17L27 24L30 22" />
        <path d="M18 19L22 30L27 30" />
      </g>
      
      {/* Central Core Dot */}
      <circle cx="16" cy="16" r="1.5" fill="#00d2ff" className="animate-pulse" />
    </svg>
  );
};

export default SpiderLogo;
