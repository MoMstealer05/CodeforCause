"use client"; 
import { useEffect, useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState("home");
  const router = useRouter();
  const pathname = usePathname();

  // ==========================================
  // 1. BULLETPROOF SCROLL TRACKER (Viewport Math)
  // ==========================================
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['contact', 'team', 'operations', 'about', 'home'];
      // Sets the "trigger wire" 1/3 of the way down your screen
      const triggerPoint = window.innerHeight / 3; 

      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          // Gets exact distance from the top of the screen, ignoring relative wrappers
          const rect = element.getBoundingClientRect(); 
          
          if (rect.top <= triggerPoint) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial checks to ensure it highlights correctly on refresh
    handleScroll();
    setTimeout(handleScroll, 100);
    setTimeout(handleScroll, 500); 

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ==========================================
  // 2. SMART NAVIGATION HANDLER
  // ==========================================
  const scrollToSection = (id: string) => {
    if (pathname === '/') {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection(id);
      }
    } else {
      // If user is on /login or another page, route them home and jump to hash
      router.push(`/#${id}`);
    }
  };

  return (
    <nav className="w-full bg-brandBase/80 backdrop-blur-md border-b border-brandCard sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <button onClick={() => scrollToSection('home')} className="flex items-center space-x-3 shrink-0 group hover:opacity-80 transition-opacity cursor-none">
            <Image
              src="/CFC.png"
              alt="Code for Cause Logo"
              width={40}
              height={40}
              className="rounded-xl" 
            />
            <div className="font-mono font-bold text-lg md:text-xl tracking-wider text-white hidden sm:flex items-center gap-2">
              CODE_FOR_CAUSE <span className="text-[#00a8a8]">$root</span>
            </div>
          </button>

          {/* Right Side */}
          <div className="hidden md:flex items-center" style={{ gap: '28px' }}>

            <button
              onClick={() => scrollToSection('home')}
              className={`transition-colors duration-300 font-medium cursor-none ${activeSection === 'home' ? 'text-causeCyan' : 'text-gray-300 hover:text-causeCyan'}`}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className={`transition-colors duration-300 font-medium cursor-none ${activeSection === 'about' ? 'text-causeCyan' : 'text-gray-300 hover:text-causeCyan'}`}
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('operations')}
              className={`transition-colors duration-300 font-medium cursor-none ${activeSection === 'operations' ? 'text-causeCyan' : 'text-gray-300 hover:text-causeCyan'}`}
            >
              Events
            </button>
            <button
              onClick={() => scrollToSection('team')}
              className={`transition-colors duration-300 font-medium cursor-none ${activeSection === 'team' ? 'text-causeCyan' : 'text-gray-300 hover:text-causeCyan'}`}
            >
              Team
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#3a3a4a' }} />

            <button
              onClick={() => scrollToSection('contact')}
              className={`text-sm font-semibold transition-colors cursor-none ${activeSection === 'contact' ? 'text-white' : 'text-gray-300 hover:text-white'}`}
            >
              Contact
            </button>

            {session ? (
              <Link
                href="/api/auth/signout"
                className="px-5 py-2 bg-red-500/10 text-red-500 rounded-lg font-bold hover:bg-red-500 hover:text-white border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all duration-300 cursor-none"
              >
                Logout
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 bg-codeBlue/20 text-codeBlue rounded-lg font-bold hover:bg-codeBlue hover:text-white border border-codeBlue/50 shadow-[0_0_15px_rgba(26,115,232,0.2)] transition-all duration-300 cursor-none"
              >
                Login
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}