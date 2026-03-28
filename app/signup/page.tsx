"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Make sure this path is correct

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("ERR_01: Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("ERR_02: Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // 🎯 FIREBASE MAGIC: Creates the user securely in your Auth tab
      await createUserWithEmailAndPassword(auth, email, password);
      
      console.log("[ SYSTEM ]: New user registered successfully.");
      
      // Redirect to the login page so they can use their new credentials
      router.push("/login?registered=true");
      
    } catch (err: any) {
      console.error("Registration failed:", err);
      // Handle specific Firebase errors for a better terminal feel
      if (err.code === "auth/email-already-in-use") {
        setError("ERR_03: Email address already allocated in system.");
      } else if (err.code === "auth/invalid-email") {
        setError("ERR_04: Invalid email format detected.");
      } else {
        setError("ERR_500: Internal registration failure.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-[#d1d5db] font-mono flex items-center justify-center p-4">
      
      {/* SCANLINES */}
      <div style={{ 
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", 
        background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.02) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.01), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.01))", 
        backgroundSize: "100% 4px, 3px 100%", zIndex: 0, pointerEvents: "none" 
      }} />

      <div className="relative z-10 w-full max-w-md bg-[#0f111a] border border-[#2a2e3f] rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* TERMINAL HEADER */}
        <div className="bg-[#05060a] border-b border-[#2a2e3f] px-4 py-2 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5555]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#f1fa8c]/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#50fa7b]/80" />
          </div>
          <span className="text-[10px] text-[#8b949e] font-bold tracking-widest uppercase">
            ROOT_REGISTRATION
          </span>
        </div>

        {/* FORM CONTENT */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-black text-white mb-2">
              INITIATE <span className="text-[#00d2ff]">USER</span>
            </h2>
            <p className="text-xs text-[#8b949e]">
              Enter credentials to establish a new encrypted node.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-[#ff5555] bg-[#ff5555]/10 text-[#ff5555] text-xs rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-[10px] text-[#50fa7b] mb-1 uppercase tracking-wider">Email_Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#05060a] border border-[#2a2e3f] focus:border-[#00d2ff] text-white text-sm p-2.5 rounded outline-none transition-colors"
                placeholder="guest@network.com"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#50fa7b] mb-1 uppercase tracking-wider">Auth_Key (Password)</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#05060a] border border-[#2a2e3f] focus:border-[#00d2ff] text-white text-sm p-2.5 rounded outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#50fa7b] mb-1 uppercase tracking-wider">Verify_Key</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#05060a] border border-[#2a2e3f] focus:border-[#00d2ff] text-white text-sm p-2.5 rounded outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 bg-[#00d2ff]/10 hover:bg-[#00d2ff]/20 border border-[#00d2ff] text-[#00d2ff] text-xs font-bold py-3 rounded uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "GENERATING NODE..." : "[ EXECUTE_REGISTRATION ]"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#8b949e]">
            Already have an active node?{' '}
            <Link href="/login" className="text-[#50fa7b] hover:underline">
              [ INITIATE_LOGIN ]
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}