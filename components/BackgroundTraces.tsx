"use client";
import React, { useEffect, useRef } from 'react';

export default function BackgroundTraces() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // 1. DATA NODES (Fixed labels scattered across the motherboard)
    const labels = [
      { x: 0.1, y: 0.2, text: "[ VOLTAGE_REG_MOD: 1.2V ]" },
      { x: 0.8, y: 0.15, text: "[ DDR4_BANK_01: ACTIVE ]" },
      { x: 0.45, y: 0.4, text: "[ CORE_TEMP: 38°C ]" },
      { x: 0.15, y: 0.7, text: "[ ETH_GATEWAY_TX: 4.2Gbps ]" },
      { x: 0.75, y: 0.8, text: "[ NVME_STORAGE_LINK ]" },
      { x: 0.5, y: 0.05, text: "[ BUS_CLK: 100MHz ]" },
      { x: 0.9, y: 0.5, text: "[ GPIO_HEADER_J1 ]" },
    ];

    const lineCount = 80; 
    const lines: any[] = [];

    const createLine = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 150 + 50,
      speed: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.25,
      dir: Math.floor(Math.random() * 3), // 0: Horizontal, 1: Vertical, 2: 45-deg
      pulse: Math.random() * Math.PI, // For glowing effect
    });

    for (let i = 0; i < lineCount; i++) {
      lines.push(createLine());
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      // --- DRAW NOTATIONS ---
      ctx.font = "9px monospace";
      labels.forEach(l => {
        const lx = l.x * width;
        const ly = l.y * height;
        
        ctx.fillStyle = "rgba(0, 210, 255, 0.4)";
        ctx.fillText(l.text, lx, ly);
        
        // Draw a small "solder point" dot next to label
        ctx.beginPath();
        ctx.arc(lx - 10, ly - 3, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- DRAW PCB TRACES ---
      lines.forEach((l) => {
        l.pulse += 0.02;
        const currentOpacity = l.opacity + (Math.sin(l.pulse) * 0.05);
        
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(0, 210, 255, ${currentOpacity})`;
        ctx.moveTo(l.x, l.y);

        // PCB Routing logic
        if (l.dir === 0) {
          ctx.lineTo(l.x + l.length, l.y);
          // Add a tiny circle at the end of the trace
          ctx.arc(l.x + l.length, l.y, 1, 0, Math.PI * 2);
        } else if (l.dir === 1) {
          ctx.lineTo(l.x, l.y + l.length);
          ctx.arc(l.x, l.y + l.length, 1, 0, Math.PI * 2);
        } else {
          ctx.lineTo(l.x + l.length/1.4, l.y + l.length/1.4);
          ctx.arc(l.x + l.length/1.4, l.y + l.length/1.4, 1, 0, Math.PI * 2);
        }
        
        ctx.stroke();

        // Slow movement
        l.y += l.speed;
        if (l.y > height) {
          l.y = -l.length;
          l.x = Math.random() * width;
        }
      });

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ filter: 'blur(0.3px)' }}
    />
  );
}