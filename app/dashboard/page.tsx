"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot, getDocs,
  doc, updateDoc, getDoc, setDoc
} from "firebase/firestore";
import { GoogleAuthProvider, linkWithPopup } from "firebase/auth";
import { downloadCertificate } from "@/lib/downloadCertificate";

const cyberStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #00d2ff33; border-radius: 10px; }
  @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .fade-in { animation: fadeSlideIn 0.3s ease forwards; }
  /* Prevent iOS bounce on modal */
  .modal-scroll { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
`;

// ─── Score formula ────────────────────────────────────────────────────────────
const calcScore = (certs: number, present: number) => certs * 2 + present;

const RANK_COLORS: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"MISSIONS" | "CERTIFICATES" | "LEADERBOARD">("MISSIONS");

  const [myMissions, setMyMissions]         = useState<any[]>([]);
  const [myCertificates, setMyCertificates] = useState<any[]>([]);
  const [eventDetails, setEventDetails]     = useState<Record<string, any>>({});
  const [selectedEvent, setSelectedEvent]   = useState<any | null>(null);
  const [loadingData, setLoadingData]       = useState(true);
  const [downloadingId, setDownloadingId]   = useState<string | null>(null);

  const [leaderboard, setLeaderboard]       = useState<any[]>([]);
  const [loadingLB, setLoadingLB]           = useState(false);

  const [pushStatus, setPushStatus]         = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle");
  const [pushLoading, setPushLoading]       = useState(false);

  const [customName, setCustomName]         = useState<string | null>(null);
  const [firestorePhoto, setFirestorePhoto] = useState<string | null>(null);

  // Lock scroll when modal open
  useEffect(() => {
    document.body.style.overflow = selectedEvent ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedEvent]);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setPushStatus("subscribed");
    else if (Notification.permission === "denied") setPushStatus("denied");
  }, []);

  useEffect(() => {
    const fetchIdentity = async () => {
      if (session?.user?.email) {
        try {
          const q = query(collection(db, "users"), where("email", "==", session.user.email.toLowerCase()));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            setCustomName(data.displayName || data.FULL_NAME || data.name || null);
            setFirestorePhoto(data.photoURL || null);
          }
        } catch (error) { console.error("Identity sync failed:", error); }
      }
    };
    fetchIdentity();
  }, [session]);

  useEffect(() => {
    if (!session?.user?.email) return;
    const userEmail = session.user.email.toLowerCase();

    const qMissions = query(collection(db, "registrations"), where("userEmail", "==", userEmail));
    const unsubMissions = onSnapshot(qMissions, async snapshot => {
      const missions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMyMissions(missions);

      const uniqueIds = [...new Set(missions.map((m: any) => m.eventId).filter(Boolean))];
      const details: Record<string, any> = {};
      await Promise.all(uniqueIds.map(async (eventId) => {
        try {
          const eventDoc = await getDoc(doc(db, "events", eventId));
          if (eventDoc.exists()) details[eventId] = { id: eventDoc.id, ...eventDoc.data() };
        } catch (e) { console.error("Event fetch failed:", e); }
      }));
      setEventDetails(prev => ({ ...prev, ...details }));
    });

    const qCerts = query(collection(db, "certificates"), where("userEmail", "==", userEmail));
    const unsubCerts = onSnapshot(qCerts, snapshot => {
      setMyCertificates(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingData(false);
    });

    return () => { unsubMissions(); unsubCerts(); };
  }, [session?.user?.email]);

  useEffect(() => {
    if (activeTab !== "LEADERBOARD") return;
    if (leaderboard.length > 0) return;
    buildLeaderboard();
  }, [activeTab]);

  const buildLeaderboard = async () => {
    setLoadingLB(true);
    try {
      const [regSnap, certSnap] = await Promise.all([
        getDocs(collection(db, "registrations")),
        getDocs(collection(db, "certificates")),
      ]);

      const tally: Record<string, { email: string; name: string; present: number; certs: number }> = {};

      regSnap.docs.forEach(d => {
        const data = d.data();
        const email = data.userEmail?.toLowerCase();
        if (!email) return;
        if (!tally[email]) tally[email] = { email, name: data.userName || email.split("@")[0], present: 0, certs: 0 };
        if (data.attendanceStatus === "PRESENT") tally[email].present += 1;
        if (data.userName && data.userName.length > tally[email].name.length) tally[email].name = data.userName;
      });

      certSnap.docs.forEach(d => {
        const data = d.data();
        const email = data.userEmail?.toLowerCase();
        if (!email) return;
        if (!tally[email]) tally[email] = { email, name: data.userName || email.split("@")[0], present: 0, certs: 0 };
        tally[email].certs += 1;
        if (data.userName && data.userName.length > tally[email].name.length) tally[email].name = data.userName;
      });

      const sorted = Object.values(tally)
        .map(t => ({ ...t, score: calcScore(t.certs, t.present) }))
        .filter(t => t.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      setLeaderboard(sorted);
    } catch (err) {
      console.error("Leaderboard build failed:", err);
    }
    setLoadingLB(false);
  };

  const handlePushSubscribe = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("unsupported");
      return;
    }
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("denied");
        setPushLoading(false);
        return;
      }
      setPushStatus("subscribed");

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      await scheduleEventNotifications(reg);

      if (session?.user?.email) {
        await setDoc(
          doc(db, "pushSubscriptions", session.user.email.toLowerCase()),
          { email: session.user.email.toLowerCase(), subscribedAt: new Date().toISOString(), active: true },
          { merge: true }
        );
      }
    } catch (err) {
      console.error("Push subscription failed:", err);
    }
    setPushLoading(false);
  };

  const scheduleEventNotifications = async (swReg: ServiceWorkerRegistration) => {
    for (const mission of myMissions) {
      const event = eventDetails[mission.eventId];
      if (!event?.countdownTarget) continue;
      const eventTime = new Date(event.countdownTarget).getTime();
      const notifyAt  = eventTime - 24 * 60 * 60 * 1000;
      const now       = Date.now();
      if (notifyAt <= now) continue;
      const delay = notifyAt - now;
      swReg.active?.postMessage({
        type: "SCHEDULE_NOTIFICATION",
        delay,
        title: `⚡ Tomorrow: ${event.title}`,
        body: `Your event at ${event.venue || "CHARUSAT"} starts in 24 hours. Don't miss it!`,
        tag: `event-${mission.eventId}`,
        url: `/dashboard`,
      });
    }
  };

  const handleDownload = async (cert: any) => {
    setDownloadingId(cert.id);
    try {
      await downloadCertificate({
        userName:    cert.userName,
        eventTitle:  cert.eventTitle,
        templateUrl: cert.templateUrl,
        nameX:       cert.nameX    ?? 50,
        nameY:       cert.nameY    ?? 50,
        fontSize:    cert.fontSize  ?? 48,
        fontColor:   cert.fontColor ?? "#ffffff",
        fontFamily:  cert.fontFamily ?? "Playfair Display",
        certHash:    cert.certHash  || cert.id,
        issueDate:   cert.issueDate,
      });
    } catch (err) {
      console.error("Certificate download failed:", err);
      alert("DOWNLOAD_FAILED: Could not generate certificate.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLinkGoogle = async () => {
    const provider = new GoogleAuthProvider();
    if (!auth.currentUser) return;
    try {
      const result = await linkWithPopup(auth.currentUser, provider);
      const user = result.user;
      const q = query(collection(db, "users"), where("email", "==", user.email?.toLowerCase()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const userDocRef = doc(db, "users", snapshot.docs[0].id);
        await updateDoc(userDocRef, { photoURL: user.photoURL });
        setFirestorePhoto(user.photoURL);
        alert("IDENTITY_LINKED: Google Profile Synchronized.");
      }
    } catch (error: any) {
      if (error.code === "auth/credential-already-in-use") alert("ERROR: This Google account is already linked to another operative.");
      else alert("SYSTEM_FAILURE: Link aborted.");
    }
  };

  if (status === "loading") return (
    <div className="min-h-screen bg-[#05060a] flex items-center justify-center">
      <div className="w-3 h-6 bg-[#00d2ff] animate-pulse" />
    </div>
  );
  if (!session?.user) return null;

  const finalName  = customName || session.user.name || session.user.email?.split("@")[0] || "OPERATIVE";
  const avatarName = /\d/.test(finalName) ? "OP" : finalName;
  const avatarSrc  = firestorePhoto || session.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=0f111a&color=00d2ff&bold=true`;
  const myEmail    = session.user.email?.toLowerCase() || "";
  const myRank     = leaderboard.findIndex(u => u.email === myEmail) + 1;

  return (
    <div className="min-h-screen bg-[#05060a] pt-16 md:pt-24 px-3 sm:px-4 md:px-8 font-mono text-white selection:bg-[#50fa7b] selection:text-black pb-16">
      <style>{cyberStyles}</style>

      <div className="max-w-5xl mx-auto">

        {/* ── PROFILE HEADER ── */}
        <div className="bg-[#0B111A] border border-white/5 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 md:mb-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-[#00d2ff]/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

          {/* Top row: avatar + back button (mobile) */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <img
                src={avatarSrc}
                alt="Profile"
                className="w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24 rounded-full border-2 border-[#00d2ff] shadow-[0_0_20px_rgba(0,210,255,0.2)] shrink-0"
                style={{ width: "clamp(3rem, 12vw, 6rem)", height: "clamp(3rem, 12vw, 6rem)" }}
              />
              <div className="min-w-0 flex-1">
                {/* Name + Authorized badge */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-lg sm:text-xl md:text-3xl font-black uppercase tracking-wider truncate">{finalName}</h1>
                  <span className="bg-[#50fa7b]/10 text-[#50fa7b] border border-[#50fa7b]/20 px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] tracking-widest uppercase font-bold shrink-0">Authorized</span>
                </div>
                {/* Email */}
                <p className="text-gray-500 text-[10px] sm:text-xs tracking-widest truncate">{session.user.email}</p>
              </div>
            </div>

            {/* Back button – top right on all screens */}
            <Link
              href="/?scrollTo=home"
              className="flex items-center gap-1.5 text-gray-500 hover:text-[#00d2ff] transition-colors text-[9px] sm:text-xs uppercase tracking-widest shrink-0 ml-2 mt-1"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Return_To_Root</span>
            </Link>
          </div>

          {/* Bottom row: action buttons */}
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {/* Push notification toggle */}
            {pushStatus !== "unsupported" && (
              <button
                onClick={pushStatus === "subscribed" ? undefined : handlePushSubscribe}
                disabled={pushLoading || pushStatus === "denied"}
                title={
                  pushStatus === "subscribed" ? "Notifications active"
                  : pushStatus === "denied"   ? "Notifications blocked in browser settings"
                  : "Enable event reminders"
                }
                className={`flex items-center gap-1.5 text-[9px] px-2.5 py-1.5 rounded-full border font-bold uppercase tracking-widest transition-all ${
                  pushStatus === "subscribed" ? "bg-[#ffb86c]/10 text-[#ffb86c] border-[#ffb86c]/30 cursor-default"
                  : pushStatus === "denied"   ? "bg-[#ff5555]/10 text-[#ff5555] border-[#ff5555]/20 opacity-60 cursor-not-allowed"
                  : "bg-white/5 text-gray-400 border-white/10 hover:border-[#ffb86c]/40 hover:text-[#ffb86c] cursor-pointer"
                }`}
              >
                {pushLoading ? (
                  <span className="w-2 h-2 rounded-full bg-[#ffb86c] animate-pulse" />
                ) : (
                  <span>{pushStatus === "subscribed" ? "🔔" : "🔕"}</span>
                )}
                {pushStatus === "subscribed" ? "Alerts_On" : pushStatus === "denied" ? "Blocked" : "Enable_Alerts"}
              </button>
            )}

            {/* Google sync */}
            {!firestorePhoto && !session.user.image && (
              <button
                onClick={handleLinkGoogle}
                className="flex items-center gap-1.5 text-[9px] bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-full transition-all text-[#00d2ff] uppercase tracking-tighter"
              >
                <img src="https://authjs.dev/img/providers/google.svg" width="10" alt="G" />
                Sync_Google
              </button>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex mb-6 md:mb-8 border-b border-white/10 overflow-x-auto custom-scrollbar -mx-1 px-1">
          {([
            { id: "MISSIONS",     label: `Events`,        count: myMissions.length,     color: "#00d2ff" },
            { id: "CERTIFICATES", label: `Certs`,         count: myCertificates.length, color: "#50fa7b" },
            { id: "LEADERBOARD",  label: "Leaderboard",   count: null,                  color: "#ffb86c" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 sm:flex-none pb-3 px-2 sm:px-4 text-[10px] sm:text-xs uppercase tracking-widest font-bold transition-all border-b-2 whitespace-nowrap min-w-0"
              style={{
                borderColor: activeTab === tab.id ? tab.color : "transparent",
                color: activeTab === tab.id ? tab.color : "#4b5563",
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  className="ml-1.5 text-[8px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: activeTab === tab.id ? `${tab.color}20` : "rgba(255,255,255,0.05)",
                    color: activeTab === tab.id ? tab.color : "#6b7280",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        {loadingData ? (
          <div className="text-[#00d2ff] font-mono animate-pulse tracking-widest text-center py-12 text-xs">
            [ Fetching_Personal_Records... ]
          </div>
        ) : (
          <div>

            {/* MISSIONS TAB */}
            {activeTab === "MISSIONS" && (
              <div className="space-y-3 md:space-y-4 fade-in">
                {myMissions.length > 0 ? myMissions.map(mission => {
                  const event = eventDetails[mission.eventId];
                  return (
                    <div
                      key={mission.id}
                      onClick={() => event && setSelectedEvent(event)}
                      className={`flex items-center gap-3 sm:gap-4 bg-[#0a0c10] border border-white/5 p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl transition-all group ${event ? "hover:border-[#00d2ff]/50 hover:bg-[#0d1420] cursor-pointer active:scale-[0.99]" : "cursor-default"}`}
                    >
                      {/* Poster thumbnail */}
                      {event?.posterUrl ? (
                        <img
                          src={event.posterUrl}
                          alt={event.title}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 border border-white/10 group-hover:border-[#00d2ff]/40 transition-all"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <span className="text-[#00d2ff] text-base">⚡</span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white group-hover:text-[#00d2ff] transition-colors leading-tight line-clamp-2">
                            {mission.eventTitle}
                          </h3>
                          <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-bold tracking-widest shrink-0 ml-1 ${
                            mission.attendanceStatus === "PRESENT" ? "bg-[#50fa7b]/10 text-[#50fa7b] border border-[#50fa7b]/20"
                            : mission.attendanceStatus === "ABSENT" ? "bg-[#ff5555]/10 text-[#ff5555] border border-[#ff5555]/20"
                            : "bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/20"
                          }`}>
                            {mission.attendanceStatus || "Reg'd"}
                          </span>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                          {event?.date || "—"}
                          {event?.venue && <span className="hidden sm:inline"> // {event.venue}</span>}
                        </p>
                        {event?.venue && (
                          <p className="text-[9px] text-gray-600 uppercase tracking-widest sm:hidden mt-0.5 truncate">{event.venue}</p>
                        )}
                      </div>

                      {/* Arrow */}
                      {event && (
                        <div className="shrink-0 text-gray-600 group-hover:text-[#00d2ff] transition-all group-hover:translate-x-0.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="text-center py-16 md:py-20 border border-dashed border-white/10 rounded-2xl md:rounded-3xl bg-white/[0.02]">
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-4">No Events Registered.</p>
                    <Link
                      href="/?scrollTo=operations"
                      className="inline-block text-[#00d2ff] border border-[#00d2ff]/30 px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#00d2ff] hover:text-black transition-all"
                    >
                      Browse_Network_Events
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* CERTIFICATES TAB */}
            {activeTab === "CERTIFICATES" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 fade-in">
                {myCertificates.length > 0 ? myCertificates.map(cert => (
                  <div key={cert.id} className="bg-[#0a0c10] border border-white/5 p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden group hover:border-[#50fa7b]/30 transition-all">
                    {/* BG shield icon */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <svg className="w-20 h-20 md:w-24 md:h-24 text-[#50fa7b]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                      </svg>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white mb-1 group-hover:text-[#50fa7b] transition-colors pr-10 relative z-10 leading-snug">
                      {cert.eventTitle}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest mb-5 relative z-10">
                      Issued: {cert.issueDate}
                    </p>

                    <div className="flex items-center justify-between relative z-10 gap-2">
                      <span className="text-[8px] text-gray-600 font-mono tracking-widest truncate flex-1">
                        HASH: {(cert.certHash || cert.id).slice(0, 12)}…
                      </span>
                      <button
                        onClick={() => handleDownload(cert)}
                        disabled={downloadingId === cert.id}
                        className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-black bg-[#50fa7b] px-3 sm:px-4 py-2 rounded-lg hover:shadow-[0_0_15px_rgba(80,250,123,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                      >
                        {downloadingId === cert.id ? (
                          <><span className="w-2 h-2 rounded-full bg-black animate-pulse inline-block" />Gen...</>
                        ) : (
                          <>↓ Download</>
                        )}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 text-center py-16 md:py-20 border border-dashed border-white/10 rounded-2xl md:rounded-3xl bg-white/[0.02]">
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">No Certificates Issued.</p>
                  </div>
                )}
              </div>
            )}

            {/* LEADERBOARD TAB */}
            {activeTab === "LEADERBOARD" && (
              <div className="fade-in">
                {/* My rank card */}
                {myRank > 0 && (
                  <div className="bg-[#0B111A] border border-[#ffb86c]/30 rounded-xl md:rounded-2xl p-4 md:p-6 mb-5 md:mb-6 flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#ffb86c]/10 border border-[#ffb86c]/30 flex items-center justify-center shrink-0">
                      <span className="text-[#ffb86c] font-black text-base md:text-lg">#{myRank}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] md:text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Your Rank</p>
                      <p className="text-white font-black uppercase tracking-wider text-xs md:text-sm truncate">{finalName}</p>
                      <p className="text-[9px] text-[#ffb86c] mt-0.5">
                        {calcScore(leaderboard[myRank - 1]?.certs ?? 0, leaderboard[myRank - 1]?.present ?? 0)} pts
                        &nbsp;·&nbsp;{leaderboard[myRank - 1]?.certs ?? 0} certs
                        &nbsp;·&nbsp;{leaderboard[myRank - 1]?.present ?? 0} attended
                      </p>
                    </div>
                  </div>
                )}

                {loadingLB ? (
                  <div className="text-[#ffb86c] animate-pulse tracking-widest text-center py-16 text-xs uppercase">
                    [ Compiling_Rankings... ]
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-gray-500 text-xs uppercase tracking-widest">No data yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {leaderboard.map((user, idx) => {
                      const rank      = idx + 1;
                      const rankColor = RANK_COLORS[rank] || "#ffffff";
                      const isMe      = user.email === myEmail;
                      return (
                        <div
                          key={user.email}
                          className={`flex items-center gap-2.5 sm:gap-4 p-3 sm:p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all ${
                            isMe ? "bg-[#ffb86c]/5 border-[#ffb86c]/30" : "bg-[#0a0c10] border-white/5 hover:border-white/10"
                          }`}
                        >
                          {/* Rank */}
                          <div className="w-8 sm:w-10 text-center shrink-0">
                            {rank <= 3 ? (
                              <span className="text-lg sm:text-xl" style={{ color: rankColor }}>
                                {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                              </span>
                            ) : (
                              <span className="text-xs font-black text-gray-500">#{rank}</span>
                            )}
                          </div>

                          {/* Avatar */}
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0f111a&color=ffb86c&bold=true&size=36`}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Name + email */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] sm:text-sm font-bold uppercase tracking-wide truncate ${isMe ? "text-[#ffb86c]" : "text-white"}`}>
                              {user.name}
                              {isMe && <span className="text-[8px] ml-1.5 text-[#ffb86c]/60">(You)</span>}
                            </p>
                            <p className="text-[8px] sm:text-[9px] text-gray-600 truncate">{user.email}</p>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            <div className="hidden sm:block text-right">
                              <p className="text-[7px] sm:text-[8px] text-gray-600 uppercase tracking-widest">Certs</p>
                              <p className="text-xs font-bold text-[#50fa7b]">{user.certs}</p>
                            </div>
                            <div className="hidden sm:block text-right">
                              <p className="text-[7px] sm:text-[8px] text-gray-600 uppercase tracking-widest">Present</p>
                              <p className="text-xs font-bold text-[#00d2ff]">{user.present}</p>
                            </div>
                            {/* On mobile: compact certs/present pill */}
                            <div className="sm:hidden flex flex-col items-end gap-0.5">
                              <span className="text-[8px] text-[#50fa7b] font-bold">{user.certs}c</span>
                              <span className="text-[8px] text-[#00d2ff] font-bold">{user.present}p</span>
                            </div>
                            <div className="text-right">
                              <p className="text-[7px] sm:text-[8px] text-gray-600 uppercase tracking-widest">Score</p>
                              <p className="text-xs sm:text-sm font-black" style={{ color: rankColor }}>{user.score}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <p className="text-center text-[8px] sm:text-[9px] text-gray-700 uppercase tracking-widest pt-4">
                      Score = Certificates × 2 + Events Attended × 1
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── EVENT DETAIL MODAL ── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full sm:max-w-[1100px] bg-[#0B111A] border border-[#2a2e3f] rounded-t-3xl sm:rounded-none overflow-hidden flex flex-col relative"
            style={{ maxHeight: "92vh", height: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Title bar */}
            <div className="bg-[#0f172a] px-4 py-2.5 flex justify-between items-center border-b border-[#2a2e3f] shrink-0 z-20">
              <div className="flex gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff5555]" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#f1fa8c]" />
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#50fa7b]" />
              </div>
              <div className="text-gray-400 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase truncate px-3">
                {selectedEvent.title.toLowerCase().replace(/\s+/g, "_")}.bin
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-white font-bold text-base sm:text-lg p-1 hover:bg-white/5 rounded w-7 h-7 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Body — stack on mobile, side-by-side on lg */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

              {/* Poster */}
              <div className="lg:w-[45%] bg-black flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#2a2e3f] shrink-0">
                {selectedEvent.posterUrl ? (
                  <img
                    src={selectedEvent.posterUrl}
                    alt={selectedEvent.title}
                    className="w-full object-contain"
                    style={{ maxHeight: "clamp(160px, 30vw, 300px)" }}
                  />
                ) : (
                  <div className="py-8 text-gray-600 font-mono tracking-widest text-xs">[ NO_VISUAL_FEED ]</div>
                )}
              </div>

              {/* Details */}
              <div className="lg:w-[55%] bg-[#0B111A] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-10 custom-scrollbar modal-scroll">
                  <div className="bg-[#00d2ff]/5 text-[#00d2ff] text-[9px] sm:text-[10px] font-bold px-3 py-1 border border-[#00d2ff]/30 w-fit mb-4 uppercase tracking-widest">
                    [ {(selectedEvent.category || "EVENT").toUpperCase()} ]
                  </div>
                  <h2 className="text-white text-2xl sm:text-3xl md:text-5xl font-black mb-2 uppercase leading-tight">
                    {selectedEvent.title}
                  </h2>
                  <p className="text-[#50fa7b] text-[10px] sm:text-xs font-bold mb-6 font-mono tracking-tighter">
                    &gt; CHARUSAT_NODE_ACTIVE
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#121824] p-3 sm:p-4 border border-white/5">
                      <div className="text-gray-500 text-[8px] sm:text-[9px] uppercase font-bold tracking-widest mb-1">DATE</div>
                      <div className="text-white text-[10px] sm:text-xs font-mono">{selectedEvent.date || "TBA"}</div>
                    </div>
                    <div className="bg-[#121824] p-3 sm:p-4 border border-white/5">
                      <div className="text-gray-500 text-[8px] sm:text-[9px] uppercase font-bold tracking-widest mb-1">TIME</div>
                      <div className="text-white text-[10px] sm:text-xs font-mono">{selectedEvent.startTime || "TBA"}</div>
                    </div>
                  </div>

                  <div className="bg-[#121824] p-3 sm:p-4 border border-white/5 mb-6">
                    <div className="text-gray-500 text-[8px] sm:text-[9px] uppercase tracking-widest font-bold mb-1">LOCATION</div>
                    <div className="text-white text-[10px] sm:text-xs font-mono">{selectedEvent.venue || "ENCRYPTED_NODE"}</div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-[#50fa7b] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] mb-3 font-mono">
                      $&gt; MISSION_DESCRIPTION
                    </h3>
                    <div className="text-gray-400 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-mono">
                      {selectedEvent.description}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="p-4 sm:p-6 md:px-10 md:pb-10 bg-[#0B111A] border-t border-white/5 shrink-0 z-10">
                  <Link
                    href={`/register/${selectedEvent.id}`}
                    className="block w-full text-center py-3.5 sm:py-4 font-black font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all text-[10px] sm:text-xs bg-[#50fa7b] hover:bg-white text-black shadow-[0_0_30px_rgba(80,250,123,0.3)]"
                  >
                    INITIALIZE_REGISTRATION ↗
                  </Link>
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="bg-[#0f172a] px-4 py-2 flex justify-between items-center border-t border-[#2a2e3f] shrink-0 z-20">
              <div className="text-[#50fa7b] text-[8px] sm:text-[9px] tracking-widest uppercase font-bold animate-pulse">
                [ SECURE_CONNECTION_STABLE ]
              </div>
              <div className="text-gray-500 text-[8px] sm:text-[9px] uppercase font-bold tracking-widest">
                PORT: 8080
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}