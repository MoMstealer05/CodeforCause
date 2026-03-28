"use client"; 
import { useEffect, useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
 
export default function Navbar() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false); // NEW
  const router = useRouter();
  const pathname = usePathname();
 
  // ==========================================
  // 1. BULLETPROOF SCROLL TRACKER (Viewport Math)
  // ==========================================
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['contact', 'team', 'operations', 'about', 'home'];
      const triggerPoint = window.innerHeight / 3; 
 
      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect(); 
          if (rect.top <= triggerPoint) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
 
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    setTimeout(handleScroll, 100);
    setTimeout(handleScroll, 500); 
 
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
 
  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
 
  // ==========================================
  // 2. SMART NAVIGATION HANDLER
  // ==========================================
  const scrollToSection = (id: string) => {
    setMenuOpen(false); // close menu on nav
    if (pathname === '/') {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection(id);
      }
    } else {
      router.push(`/#${id}`);
    }
  };
 
  const navLinks = [
    { id: 'home',       label: 'Home' },
    { id: 'about',      label: 'About' },
    { id: 'operations', label: 'Events' },
    { id: 'team',       label: 'Team' },
    { id: 'contact',    label: 'Contact' },
  ];
 
  return (
    <nav className="w-full bg-brandBase/80 backdrop-blur-md border-b border-brandCard sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
 
          {/* Logo */}
          <button
            onClick={() => scrollToSection('home')}
            className="flex items-center space-x-3 shrink-0 group hover:opacity-80 transition-opacity cursor-none"
          >
            <Image
              src="/CFC.png"
              alt="Code for Cause Logo"
              width={40}
              height={40}
              className="rounded-xl" 
            />
            <div className="font-mono font-bold text-sm md:text-xl tracking-wider text-white flex items-center gap-2">
              CODE_FOR_CAUSE <span className="text-[#00a8a8]">$root</span>
            </div>
          </button>
 
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center" style={{ gap: '28px' }}>
            {navLinks.slice(0, 4).map(link => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`transition-colors duration-300 font-medium cursor-none ${
                  activeSection === link.id ? 'text-causeCyan' : 'text-gray-300 hover:text-causeCyan'
                }`}
              >
                {link.label}
              </button>
            ))}
 
            <div style={{ width: '1px', height: '20px', backgroundColor: '#3a3a4a' }} />
 
            <button
              onClick={() => scrollToSection('contact')}
              className={`text-sm font-semibold transition-colors cursor-none ${
                activeSection === 'contact' ? 'text-white' : 'text-gray-300 hover:text-white'
              }`}
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
                [ ROOT_LOGIN ]
              </Link>
            )}
          </div>
 
          {/* Hamburger Button (mobile only) */}
          <button
            onClick={() => setMenuOpen(prev => !prev)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
 
        </div>
      </div>
 
      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col px-6 pb-6 pt-2 gap-4 border-t border-brandCard bg-brandBase/95">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`text-left text-base font-medium transition-colors duration-300 ${
                activeSection === link.id ? 'text-causeCyan' : 'text-gray-300 hover:text-causeCyan'
              }`}
            >
              {link.label}
            </button>
          ))}
 
          <div className="border-t border-brandCard pt-4">
            {session ? (
              <Link
                href="/api/auth/signout"
                className="block w-full text-center px-5 py-2 bg-red-500/10 text-red-500 rounded-lg font-bold hover:bg-red-500 hover:text-white border border-red-500/30 transition-all duration-300"
              >
                Logout
              </Link>
            ) : (
              <Link
                href="/login"
                className="block w-full text-center px-5 py-2 bg-codeBlue/20 text-codeBlue rounded-lg font-bold hover:bg-codeBlue hover:text-white border border-codeBlue/50 transition-all duration-300"
              >
                [ ROOT_LOGIN ]
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}