// app/verify/[certHash]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

type VerifyStatus = "LOADING" | "VALID" | "INVALID";

export default function VerifyCertificate() {
  const params = useParams();
  const certHash = params.certHash as string;

  const [status, setStatus] = useState<VerifyStatus>("LOADING");
  const [certData, setCertData] = useState<any>(null);

  useEffect(() => {
    if (!certHash) { setStatus("INVALID"); return; }

    const verify = async () => {
      try {
        const q = query(
          collection(db, "certificates"),
          where("certHash", "==", certHash.toUpperCase())
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          setCertData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
          setStatus("VALID");
        } else {
          setStatus("INVALID");
        }
      } catch (err) {
        console.error("Verification failed:", err);
        setStatus("INVALID");
      }
    };

    verify();
  }, [certHash]);

  return (
    <div className="min-h-screen bg-[#05060a] flex items-center justify-center p-4 font-mono text-white">

      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#00d2ff 1px, transparent 1px), linear-gradient(90deg, #00d2ff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="w-full max-w-lg relative z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-[#00d2ff]/60 hover:text-[#00d2ff] transition-colors text-[10px] uppercase tracking-widest">
            ← CFC_CHARUSAT
          </Link>
          <p className="text-gray-600 text-[10px] uppercase tracking-[0.3em]">Certificate Verification Terminal</p>
        </div>

        {/* LOADING */}
        {status === "LOADING" && (
          <div className="bg-[#0B111A] border border-white/10 rounded-2xl p-10 text-center">
            <div className="flex justify-center gap-2 mb-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-[#00d2ff] animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <p className="text-[#00d2ff] text-xs uppercase tracking-[0.3em] animate-pulse">
              Querying_Blockchain...
            </p>
            <p className="text-gray-600 text-[9px] mt-2 uppercase tracking-widest">
              CERT#{certHash?.toUpperCase()}
            </p>
          </div>
        )}

        {/* VALID */}
        {status === "VALID" && certData && (
          <div className="bg-[#0B111A] border border-[#50fa7b]/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(80,250,123,0.08)]">

            {/* Status bar */}
            <div className="bg-[#50fa7b]/10 border-b border-[#50fa7b]/20 px-6 py-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#50fa7b] animate-pulse shrink-0" />
              <span className="text-[#50fa7b] text-xs font-black uppercase tracking-[0.3em]">
                ✓ Certificate Verified
              </span>
            </div>

            <div className="p-8">
              {/* Big checkmark */}
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 rounded-full bg-[#50fa7b]/10 border-2 border-[#50fa7b]/30 flex items-center justify-center shadow-[0_0_30px_rgba(80,250,123,0.15)]">
                  <span className="text-[#50fa7b] text-4xl">✓</span>
                </div>
              </div>

              {/* Cert details */}
              <div className="space-y-4 mb-8">
                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Issued To</p>
                  <p className="text-white text-lg font-black uppercase tracking-wider">{certData.userName}</p>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Event</p>
                  <p className="text-white text-sm font-bold uppercase tracking-wide">{certData.eventTitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Issue Date</p>
                    <p className="text-white text-xs font-bold">{certData.issueDate}</p>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Issued By</p>
                    <p className="text-[#00d2ff] text-xs font-bold">CFC · CHARUSAT</p>
                  </div>
                </div>
              </div>

              {/* Hash */}
              <div className="bg-[#50fa7b]/5 border border-[#50fa7b]/20 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-0.5">Certificate Hash</p>
                  <p className="text-[#50fa7b] text-xs font-mono font-bold tracking-widest">#{certData.certHash}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#50fa7b] animate-pulse shrink-0" />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-black/30 border-t border-white/5 px-6 py-3 flex items-center justify-between">
              <p className="text-[8px] text-gray-600 uppercase tracking-widest">Code For Cause · CHARUSAT</p>
              <p className="text-[8px] text-[#50fa7b] uppercase tracking-widest font-bold">Authentic</p>
            </div>
          </div>
        )}

        {/* INVALID */}
        {status === "INVALID" && (
          <div className="bg-[#0B111A] border border-[#ff5555]/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(255,85,85,0.05)]">

            {/* Status bar */}
            <div className="bg-[#ff5555]/10 border-b border-[#ff5555]/20 px-6 py-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#ff5555] shrink-0" />
              <span className="text-[#ff5555] text-xs font-black uppercase tracking-[0.3em]">
                ✗ Verification Failed
              </span>
            </div>

            <div className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[#ff5555]/10 border-2 border-[#ff5555]/30 flex items-center justify-center">
                  <span className="text-[#ff5555] text-4xl">✗</span>
                </div>
              </div>

              <h2 className="text-white font-black text-lg uppercase tracking-widest mb-2">
                Certificate Not Found
              </h2>
              <p className="text-gray-500 text-xs uppercase tracking-widest leading-relaxed mb-6">
                This certificate hash does not exist in our records. It may be invalid, tampered, or expired.
              </p>

              <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 mb-8">
                <p className="text-[8px] text-gray-600 uppercase tracking-widest mb-1">Queried Hash</p>
                <p className="text-[#ff5555] text-xs font-mono">#{certHash?.toUpperCase()}</p>
              </div>

              <Link href="/" className="inline-block text-[10px] uppercase font-bold tracking-widest text-black bg-white px-6 py-3 rounded-xl hover:bg-[#00d2ff] transition-all">
                Return To CFC
              </Link>
            </div>
          </div>
        )}

        {/* Bottom note */}
        <p className="text-center text-gray-700 text-[9px] uppercase tracking-widest mt-6">
          Certificates issued by Code For Cause · CHARUSAT University
        </p>
      </div>
    </div>
  );
}