"use client";
import { useEffect, useState } from "react";

export default function CyberCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updateCursor);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updateCursor);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="hidden md:block fixed top-0 left-0 pointer-events-none z-[10000] mix-blend-screen"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        
        {/* --- DEFAULT: The tiny laser pointer --- */}
        <div 
          className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-200 z-10 ${
            isHovering 
              ? 'bg-[#00d2ff] opacity-0 scale-50' 
              : 'bg-[#00d2ff] shadow-[0_0_10px_#00d2ff] opacity-100 scale-100'
          }`}
        ></div>
        
        {/* --- HOVER: The Custom ESP32 Chip (Now in Cyan) --- */}
        <div 
          className={`absolute transition-all duration-300 ease-out flex items-center justify-center ${
            isHovering 
              ? 'opacity-100 scale-100 rotate-0 drop-shadow-[0_0_8px_rgba(0,210,255,0.6)]' 
              : 'opacity-0 scale-50 -rotate-12'
          }`}
        >
          {/* Custom ESP-WROOM-32 SVG */}
          <svg width="28" height="38" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Main body of the chip */}
            <rect x="3" y="2" width="18" height="28" rx="1" stroke="#00d2ff" strokeWidth="1.5" fill="#0a0b10"/>
            
            {/* Antenna Section Background */}
            <rect x="3" y="2" width="18" height="8" fill="#00d2ff" fillOpacity="0.15"/>
            {/* Antenna PCB Trace (Squiggly line) */}
            <path d="M6 5.5H8.5V8H11.5V5.5H14.5V8H17.5" stroke="#00d2ff" strokeWidth="1"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke="#00d2ff" strokeWidth="1.5"/>
            
            {/* Left GPIO Pins */}
            <rect x="1" y="13" width="2" height="1.5" fill="#00d2ff"/>
            <rect x="1" y="16" width="2" height="1.5" fill="#00d2ff"/>
            <rect x="1" y="19" width="2" height="1.5" fill="#00d2ff"/>
            <rect x="1" y="22" width="2" height="1.5" fill="#00d2ff"/>
            <rect x="1" y="25" width="2" height="1.5" fill="#00d2ff"/>
            <rect x="1" y="28" width="2" height="1.5" fill="#00d2ff"/>
            
            {/* Right GPIO Pins */}
            <rect x="21" y="13" width="2" height="1.5" fill="#00d2ff"/>
            <rect x="21" y="16" width="2" height="1.5" fill="#00d2ff"/>
            <rect x="21" y="19" width="2" height="1.5" fill="#00d2ff"/>
            <rect x="21" y="22" width="2" height="1.5" fill="#00d2ff"/>
            <rect x="21" y="25" width="2" height="1.5" fill="#00d2ff"/>
            <rect x="21" y="28" width="2" height="1.5" fill="#00d2ff"/>
          </svg>
          
          {/* A tiny dot in the center so the user knows exactly where the click registers */}
          <div className="absolute w-1 h-1 bg-[#00d2ff] rounded-full"></div>
        </div>

      </div>
    </div>
  );
}