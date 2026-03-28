"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState("");
  const [activeSection, setActiveSection] = useState("home"); 
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [shouldHideForModal, setShouldHideForModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // --- Unified Scroll & Modal Detection ---
  useEffect(() => {
    const handleScrollAndModal = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Check if the body is locked (Details Pane is open)
      setShouldHideForModal(document.body.style.overflow === 'hidden');

      if (pathname !== '/') return;
      
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

    const modalCheckInterval = setInterval(handleScrollAndModal, 100);
    window.addEventListener("scroll", handleScrollAndModal);
    
    return () => {
      window.removeEventListener("scroll", handleScrollAndModal);
      clearInterval(modalCheckInterval);
    };
  }, [pathname]);

  // --- Admin Reroute ---
  useEffect(() => {
    const ADMIN_EMAIL = "23ec017@charusat.edu.in";
    // Skip reroute if we just logged out (?bye=1) — session may still linger briefly
    const isLoggingOut = typeof window !== "undefined" && window.location.search.includes("bye=1");
    if (isLoggingOut) return;
    if (status === "authenticated" && session?.user?.email === ADMIN_EMAIL) {
      if (pathname === "/" || pathname === "/login") {
        router.push("/admin");
      }
    }
  }, [session, status, pathname, router]);

  // --- Terminal Clock ---
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    if (confirm("CRITICAL_ACTION: Terminate root session?")) {
      await signOut({ redirect: false });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/"; 
    }
  };

  const scrollToSection = (id: string) => {
    setMenuOpen(false);
    if (pathname === '/') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    } else {
      router.push(`/?scrollTo=${id}`);
    }
  };

  const getNavItemStyle = (id: string) => {
    const isActive = activeSection === id && pathname === '/';
    return {
      color: isActive ? '#00d2ff' : '#8b949e',
      background: isActive ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
      textDecoration: 'none',
      fontSize: '11px',
      fontWeight: 600,
      padding: '6px 10px',
      borderRadius: '4px',
      fontFamily: "monospace",
      transition: 'all 0.3s ease',
      border: isActive ? '1px solid #00d2ff' : '1px solid transparent',
      cursor: 'pointer',
    } as React.CSSProperties;
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'operations', label: 'Events' },
    { id: 'team', label: 'Team' },
    { id: 'contact', label: 'Contact' },
  ];

  const isAdminPage = pathname === "/admin" || pathname === "/login";

  return (
    <div style={{ color: "#d1d5db", fontFamily: "monospace", minHeight: '100vh', backgroundColor: '#05060a' }}>
      
      {/* 🚀 ONLY RENDER NAV IF NOT ON ADMIN/LOGIN PAGE */}
      {!isAdminPage && (
        <>
          <nav style={{
            width: isScrolled ? "92%" : "100%",
            maxWidth: isScrolled ? "1200px" : "100%",
            height: "50px", 
            backgroundColor: isScrolled ? "rgba(15, 17, 26, 0.85)" : "#0f111a", 
            backdropFilter: isScrolled ? "blur(16px)" : "none",
            border: isScrolled ? "1px solid rgba(0, 210, 255, 0.3)" : "1px solid #2a2e3f",
            borderRadius: isScrolled ? "16px" : "0px",
            display: "flex", 
            alignItems: "center", 
            padding: "0 16px", 
            justifyContent: "space-between",
            position: "fixed", 
            top: shouldHideForModal ? "-100px" : (isScrolled ? "15px" : "0px"), 
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            boxShadow: isScrolled ? "0 10px 40px rgba(0,0,0,0.6)" : "none",
            opacity: shouldHideForModal ? 0 : 1,
            pointerEvents: shouldHideForModal ? "none" : "auto",
          }}>
            
            <button onClick={() => scrollToSection('home')} style={{ display: "flex", alignItems: "center", gap: "8px", background: 'none', border: 'none', cursor: 'pointer' }}>
              <Image src="/CFC.png" alt="CFC" width={26} height={26} />
              <div style={{ color: "#fff", fontWeight: 900, fontSize: '13px', letterSpacing: '0.5px' }}>
                CODE_FOR_CAUSE <span className="hidden sm:inline" style={{ color: '#00d2ff', opacity: 0.6 }}>$root</span>
              </div>
            </button>

            <div className="hidden md:flex" style={{ gap: "4px" }}>
              {navLinks.map(link => (
                <button key={link.id} onClick={() => scrollToSection(link.id)} style={getNavItemStyle(link.id)}>
                  {link.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span className="hidden lg:inline-block" style={{ color: '#50fa7b', fontSize: '11px', fontWeight: 'bold' }}>
                {time || "BOOTING..."}
              </span>
              
              {status === "authenticated" && session?.user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* 🚀 FIXED: Added referrerPolicy so Google doesn't block the image */}
                  <img 
                    src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.email?.charAt(0).toUpperCase() || 'U'}&background=0f111a&color=00d2ff&bold=true`} 
                    alt="User" 
                    referrerPolicy="no-referrer"
                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid #50fa7b', objectFit: 'cover' }}
                  />
                  <button onClick={handleLogout} style={{ border: '1px solid #ff5555', color: '#ff5555', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', backgroundColor: 'transparent' }}>
                    [ROOT_EXIT]
                  </button>
                </div>
              ) : (
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <div style={{ border: '1px solid #50fa7b', color: '#50fa7b', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace', backgroundColor: 'rgba(80, 250, 123, 0.05)' }}>
                    [ ROOT_LOGIN ]
                  </div>
                </Link>
              )}

              <button onClick={() => setMenuOpen(!menuOpen)} className="flex md:hidden flex-col gap-[5px] p-1 border-none bg-none cursor-pointer">
                <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: '#00d2ff', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
                <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: '#00d2ff', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
                <span style={{ display: 'block', width: '20px', height: '2px', backgroundColor: '#00d2ff', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
              </button>
            </div>
          </nav>

          {/* MOBILE DROPDOWN */}
          <div
            className="md:hidden"
            style={{
              position: 'fixed',
              top: isScrolled ? '75px' : '55px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '92%',
              backgroundColor: 'rgba(15, 17, 26, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(0, 210, 255, 0.2)',
              maxHeight: menuOpen ? '350px' : '0px',
              opacity: menuOpen ? 1 : 0,
              // 🚀 THE FIX: overflow hidden and dynamic pointer events stop the invisible shield!
              overflow: 'hidden',
              pointerEvents: menuOpen ? 'auto' : 'none',
              transition: 'all 0.4s ease-in-out',
              zIndex: 999,
              display: shouldHideForModal ? 'none' : 'block'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '8px' }}>
              {navLinks.map(link => (
                <button key={link.id} onClick={() => scrollToSection(link.id)} style={{ ...getNavItemStyle(link.id), fontSize: '13px', padding: '12px', textAlign: 'left', width: '100%' }}>
                  {`> ${link.label}`}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* GLOBAL OVERLAYS */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.02) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.01), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.01))", backgroundSize: "100% 4px, 3px 100%", zIndex: 9999, pointerEvents: "none" }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}