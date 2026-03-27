"use client";
import { useState, useEffect } from "react";

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export default function HomeTimer({ target }: { target: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const calculateTimeLeft = () => {
      const difference = +new Date(target) - +new Date();
      let newTimeLeft = { days: "00", hours: "00", minutes: "00", seconds: "00" };

      if (difference > 0) {
        newTimeLeft = {
          days: String(Math.floor(difference / (1000 * 60 * 60 * 24))).padStart(2, '0'),
          hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
          minutes: String(Math.floor((difference / 1000 / 60) % 60)).padStart(2, '0'),
          seconds: String(Math.floor((difference / 1000) % 60)).padStart(2, '0'),
        };
      }
      return newTimeLeft;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  if (!isMounted) return null; 

  // Clean, raw text units (Cyan)
 const TimeUnit = ({ value, label }: { value: string, label: string }) => (
    <div className="flex flex-col items-center justify-center">
      <span className="text-5xl md:text-7xl lg:text-8xl font-black text-[#00d2ff] tracking-tight tabular-nums leading-none drop-shadow-[0_0_15px_rgba(0,210,255,0.3)]">
        {value}
      </span>
      <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#00d2ff] mt-4 uppercase">
        {label}
      </span>
    </div>
  );

  // Blinking Colons (Cyan)
  const Separator = () => (
    <div className="text-3xl md:text-6xl font-black text-[#00d2ff]/50 pb-8 animate-pulse px-4 md:px-8">
      :
    </div>
  );

 // Inside HomeTimer.tsx - Change your return to this:
return (
    <div className="flex flex-col items-center justify-center font-mono">
      {/* 🎯 "EVENT STARTS IN IST" - Cyan */}
      <div className="text-[#00d2ff] text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2 opacity-80">
        EVENT STARTS IN <span className="text-gray-600 text-[9px]">IST</span>
      </div>
      
      {/* 🎯 CYAN NUMBERS - Sized for the slim box */}
      <div className="flex items-center justify-center scale-90 md:scale-100">
        <div className="flex flex-col items-center">
          <span className="text-4xl md:text-5xl font-black text-[#00d2ff] tabular-nums leading-none drop-shadow-[0_0_10px_rgba(0,210,255,0.2)]">{timeLeft.days}</span>
          <span className="text-[8px] font-bold text-[#00d2ff]/50 mt-2 tracking-widest uppercase">DAYS</span>
        </div>
        
        <span className="text-2xl font-black text-[#00d2ff]/20 pb-6 px-4 animate-pulse">:</span>

        <div className="flex flex-col items-center">
          <span className="text-4xl md:text-5xl font-black text-[#00d2ff] tabular-nums leading-none drop-shadow-[0_0_10px_rgba(0,210,255,0.2)]">{timeLeft.hours}</span>
          <span className="text-[8px] font-bold text-[#00d2ff]/50 mt-2 tracking-widest uppercase">HOURS</span>
        </div>

        <span className="text-2xl font-black text-[#00d2ff]/20 pb-6 px-4 animate-pulse">:</span>

        <div className="flex flex-col items-center">
          <span className="text-4xl md:text-5xl font-black text-[#00d2ff] tabular-nums leading-none drop-shadow-[0_0_10px_rgba(0,210,255,0.2)]">{timeLeft.minutes}</span>
          <span className="text-[8px] font-bold text-[#00d2ff]/50 mt-2 tracking-widest uppercase">MINUTES</span>
        </div>

        <span className="text-2xl font-black text-[#00d2ff]/20 pb-6 px-4 animate-pulse">:</span>

        <div className="flex flex-col items-center">
          <span className="text-4xl md:text-5xl font-black text-[#00d2ff] tabular-nums leading-none drop-shadow-[0_0_10px_rgba(0,210,255,0.2)]">{timeLeft.seconds}</span>
          <span className="text-[8px] font-bold text-[#00d2ff]/50 mt-2 tracking-widest uppercase">SECONDS</span>
        </div>
      </div>
    </div>
  );
  
}