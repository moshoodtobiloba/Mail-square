import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 48 }) => {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Main Square Container - Meaning: Structure & Unity */}
        <rect 
          x="10" 
          y="10" 
          width="80" 
          height="80" 
          rx="20" 
          fill="#0B57D0" 
        />
        
        {/* Envelope Flap / Stylized 'M' - Meaning: Communication & Velocity */}
        <path
          d="M25 40L50 55L75 40V65C75 67.7614 72.7614 70 70 70H30C27.2386 70 25 67.7614 25 65V40Z"
          fill="white"
        />
        <path
          d="M25 35C25 32.2386 27.2386 30 30 30H70C72.7614 30 75 32.2386 75 35V42L50 58L25 42V35Z"
          fill="#D3E3FD"
        />
      </svg>
    </div>
  );
};

export const LogoText: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`font-sans font-semibold tracking-tight text-gray-900 ${className}`}>
    Mail<span className="text-[#0B57D0]">Square</span>
  </span>
);
