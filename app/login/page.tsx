"use client";
import { useState, Suspense } from "react";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); 
  const router = useRouter();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(""); 

    try {
      // 1. Verify with Firebase First
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Sync with NextAuth immediately to create the session cookie
      const result = await nextAuthSignIn("credentials", {
        email: firebaseUser.email,
        password: password, 
        redirect: false,
      });

      if (result?.error) {
        setErrorMsg("SESSION_SYNC_ERROR: " + result.error.toUpperCase());
        setLoading(false);
        return;
      }

      // 3. SUCCESS: Hard refresh to root so ClientLayout picks up the new session
      setTimeout(() => {
        window.location.href = "/"; 
      }, 150);

    } catch (error: any) {
      // Handle Firebase Specific Errors
      if (
        error.code === "auth/invalid-credential" || 
        error.code === "auth/wrong-password" || 
        error.code === "auth/user-not-found"
      ) {
        setErrorMsg("ACCESS_DENIED: INVALID_CREDENTIALS");
      } else {
        setErrorMsg("SYSTEM_ERROR: " + error.message.toUpperCase());
      }
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: 'calc(100vh - 50px)', backgroundColor: '#050A14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '450px', 
        backgroundColor: '#0B111A', 
        border: `1px solid ${errorMsg ? '#ff5555' : 'rgba(0,210,255,0.2)'}`, 
        borderRadius: '24px', 
        padding: '48px 32px', 
        textAlign: 'center', 
        transition: 'all 0.3s ease',
        boxShadow: errorMsg ? '0 0 20px rgba(255, 85, 85, 0.1)' : 'none'
      }}>
        
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', padding: '8px 20px', border: '2px solid #00d2ff', color: '#00d2ff', fontWeight: 900, fontFamily: 'monospace' }}>
            CODE_FOR_CAUSE
          </div>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>Root Access</h1>

        {/* ERROR DISPLAY */}
        {errorMsg && (
          <div style={{ 
            color: '#ff5555', 
            backgroundColor: 'rgba(255, 85, 85, 0.1)', 
            border: '1px solid #ff5555', 
            padding: '10px', 
            fontSize: '11px', 
            fontWeight: 'bold', 
            fontFamily: 'monospace',
            marginTop: '20px',
            borderRadius: '8px',
            animation: 'shake 0.4s ease-in-out'
          }}>
            [!] {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleEmailSignIn} style={{ textAlign: 'left', marginTop: errorMsg ? '15px' : '30px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#fff', fontSize: '10px', display: 'block', marginBottom: '8px', opacity: 0.6 }}>EMAIL_IDENTITY</label>
            <input 
              type="email" 
              required 
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle} 
              placeholder="user@charusat.edu.in" 
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ color: '#fff', fontSize: '10px', display: 'block', marginBottom: '8px', opacity: 0.6 }}>ACCESS_KEY</label>
            <input 
              type="password" 
              required 
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle} 
              placeholder="••••••••" 
            />
          </div>

          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? "VERIFYING_CREDENTIALS..." : "SIGN IN →"}
          </button>
        </form>

        <div style={dividerStyle}><span>OR AUTHORIZE VIA</span></div>

        {/* GOOGLE SSO */}
        <button 
          onClick={() => nextAuthSignIn("google", { callbackUrl: "/" })}
          style={secondaryBtn}
        >
          <img src="https://authjs.dev/img/providers/google.svg" width="18" alt="G" />
          Continue with Google
        </button>

        <Link href="/register" style={{ textDecoration: 'none' }}>
            <button style={{ ...secondaryBtn, marginTop: '12px', borderColor: '#50fa7b', color: '#50fa7b' }}>
               [ NEW_USER_REGISTRATION ]
            </button>
        </Link>
        
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </main>
  );
}

// --- STYLES ---
const inputStyle = { 
  width: '100%', 
  backgroundColor: 'rgba(255,255,255,0.03)', 
  border: '1px solid #2a2e3f', 
  borderRadius: '12px', 
  padding: '14px', 
  color: '#fff', 
  outline: 'none',
  fontFamily: 'monospace',
  fontSize: '14px'
};

const primaryBtn = { 
  width: '100%', 
  backgroundColor: '#00d2ff', 
  color: '#000', 
  border: 'none', 
  borderRadius: '12px', 
  padding: '16px', 
  fontWeight: 900, 
  cursor: 'pointer', 
  boxShadow: '0 0 15px rgba(0, 210, 255, 0.2)',
  fontFamily: 'monospace',
  transition: '0.2s'
};

const secondaryBtn = { 
  width: '100%', 
  backgroundColor: 'transparent', 
  border: '1px solid #2a2e3f', 
  color: '#fff', 
  borderRadius: '12px', 
  padding: '14px', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  gap: '10px', 
  cursor: 'pointer', 
  transition: '0.2s',
  fontFamily: 'monospace',
  fontSize: '12px'
};

const dividerStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px', 
  color: '#444', 
  fontSize: '10px', 
  margin: '24px 0',
  fontFamily: 'monospace'
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ color: '#00d2ff', padding: '50px', fontFamily: 'monospace' }}>BOOTING_SYSTEM_AUTH...</div>}>
      <LoginContent />
    </Suspense>
  );
}