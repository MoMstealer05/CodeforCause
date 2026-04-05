"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

// ── YOUR EXISTING STATIC EVENTS (always shown) ──
const STATIC_EVENTS = [
  {
    id: "cfc-past-006",
    title: "AWS For ECE",
    date: "2026-03-23",
    category: "WORKSHOP",
    venue: "Seminar Hall, 2nd floor, A6 building",
    description: "A technical workshop tailored for ECE students demonstrating how cloud infrastructure supports modern hardware systems, IoT, and signal processing workflows.",
    status: "ARCHIVED",
    faculty: ["Dr. Upesh Patel", "Dr. Purvi Prajapati"],
    students: ["Vedansh Verdia", "Jiya Thakkar"],
    participants: 72,
    outcome: "Successfully introduced 72 students to Amazon Web Services (AWS), providing hands-on experience in cloud computing, EC2, S3, and infrastructure management."
  },
  {
    id: "cfc-past-005",
    title: "CODE.PY - Python Hackathon",
    date: "2025-03-17 to 2025-03-19",
    category: "HACKATHON",
    venue: "Project Lab-2, CSPIT",
    description: "A comprehensive three-day Python hackathon challenging students to build, debug, and deliver working Python-based solutions to real-world problems under time constraints.",
    status: "ARCHIVED",
    faculty: ["Dr. Killol Pandya", "Dr. Sagar Patel", "Prof. Vishal Shah"],
    students: ["Vedansh Verdia", "Priyanshu Purohit", "Pruthvish Dave"],
    participants: 120,
    outcome: "Participants enhanced their logical thinking and Python coding proficiency, successfully delivering working software solutions by the end of the 3-day sprint."
  },
  {
    id: "cfc-past-004",
    title: "C Hackathon",
    date: "2024-10-19",
    category: "HACKATHON",
    venue: "Project Lab-2, CSPIT",
    description: "Immersed participants in the core concepts of C programming through competitive challenges. Focused on solving real-world problems using C and enhancing coding efficiency.",
    status: "ARCHIVED",
    faculty: ["Dr. Killol V. Pandya"],
    students: ["Pruthvish Dave", "Suchita Gaddam", "Moksh Chavada", "Vedansh Verdia", "Priyanshu Purohit"],
    participants: 75,
    outcome: "75 first-semester students gained hands-on experience in algorithm design and problem-solving, fostering a collaborative and competitive programming environment."
  },
  {
    id: "cfc-past-003",
    title: "Arduino Hands-on Experience (Vol. 2)",
    date: "2024-09-26",
    category: "WORKSHOP",
    venue: "Project Lab 2, CSPIT",
    description: "A hands-on workshop introducing first-year students to the fundamentals of Arduino, including understanding basic projects and interfacing with ultrasonic and 7-segment sensors.",
    status: "ARCHIVED",
    faculty: ["Dr. Killol V. Pandya"],
    students: ["Vedansh Verdia", "Priyanshu Purohit", "Moksh Chavada", "Suchita Gaddam", "Pruthvish Dave"],
    participants: 60,
    outcome: "First-year students successfully built and simulated basic Arduino circuits, grasping the core concepts of microcontroller interfacing."
  },
  {
    id: "cfc-past-002",
    title: "Arduino Hands-on Experience",
    date: "2024-03-16",
    category: "WORKSHOP",
    venue: "Project Lab-II, CSPIT",
    description: "Introduced participants to the fundamentals of Arduino. Covered basic projects, interfacing with different sensors like ultrasonic, IR, 7 segment, and designing circuits in Proteus software.",
    status: "ARCHIVED",
    faculty: ["Dr. Killol V. Pandya"],
    students: ["Kushal Shah", "Priyanshu Talapara", "Kashyap Vaghani", "Saharsh Solanki"],
    participants: 65,
    outcome: "Participants developed valuable skills in coding, circuit design, and problem-solving through practical exercises with Proteus software and physical sensors."
  },
  {
    id: "cfc-past-001",
    title: "Hackathon 2023: Codefeista",
    date: "2023-10-11",
    category: "HACKATHON",
    venue: "CSPIT, CHARUSAT",
    description: "First-year students gained valuable hands-on experience in coding, debugging, teamwork, and project management through logical analysis and problem-solving.",
    status: "ARCHIVED",
    faculty: ["Dr. Killol V. Pandya"],
    students: ["Kushal Shah", "Priyanshu Talapara", "Kashyap Vaghani", "Kartik Singh", "Sreelakshmi Kurup"],
    participants: 80,
    outcome: "Successfully challenged coders with a new set of problem statements, improving their critical thinking and project management skills under pressure."
  }
];

const cyberStyles = `
  @keyframes drawLine {
    from { height: 0; }
    to   { height: 100%; }
  }
  .animate-line { animation: drawLine 2s ease-out forwards; }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 10px #50fa7b, 0 0 20px #50fa7b; }
    50%       { box-shadow: 0 0 2px  #50fa7b, 0 0  5px #50fa7b; }
  }
  .node-glow { animation: pulseGlow 3s infinite; }

  .custom-scrollbar::-webkit-scrollbar       { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #50fa7b40; border-radius: 10px; }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .modal-enter { animation: fadeSlideIn 0.25s ease forwards; }

  /* Make sure modal never overflows on small screens */
  .modal-body  { overflow-y: auto; -webkit-overflow-scrolling: touch; }
`;

function normalise(raw: any) {
  return {
    id:           raw.id            ?? "",
    title:        raw.title         ?? "Untitled",
    date:         raw.date          ?? "",
    category:     (raw.category     ?? "WORKSHOP").toUpperCase(),
    venue:        raw.venue         ?? "",
    description:  raw.description   ?? "",
    status:       raw.status        ?? "ARCHIVED",
    faculty:      Array.isArray(raw.faculty)  ? raw.faculty  : (raw.faculty  ? [raw.faculty]  : []),
    students:     Array.isArray(raw.students) ? raw.students : (raw.students ? [raw.students] : []),
    participants: Number(raw.participants) || 0,
    outcome:      raw.outcome       ?? "",
  };
}

function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) { document.body.style.overflow = ""; return; }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [active]);
}

function categoryStyle(cat: string) {
  switch (cat) {
    case "HACKATHON":   return "bg-[#bd93f9]/10 border-[#bd93f9]/30 text-[#bd93f9]";
    case "SEMINAR":     return "bg-[#50fa7b]/10 border-[#50fa7b]/30 text-[#50fa7b]";
    case "COMPETITION": return "bg-[#ff79c6]/10 border-[#ff79c6]/30 text-[#ff79c6]";
    default:            return "bg-[#ffb86c]/10 border-[#ffb86c]/30 text-[#ffb86c]";
  }
}

export default function ArchiveSection() {
  const [mounted, setMounted]                 = useState(false);
  const [selectedReport, setSelectedReport]   = useState<any | null>(null);
  const [firestoreEvents, setFirestoreEvents] = useState<any[]>([]);

  useScrollLock(!!selectedReport);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "archive"), orderBy("date", "desc")),
      (snap) => setFirestoreEvents(snap.docs.map((d) => normalise({ id: d.id, ...d.data() }))),
      ()     => setFirestoreEvents([])
    );
    return () => unsub();
  }, []);

  // New admin entries on top, original 6 always below
  const events = [...firestoreEvents, ...STATIC_EVENTS];

  return (
    <section
      id="archive"
      className="w-full bg-[#05060a] border-t border-white/5 py-16 md:py-24 relative z-10 scroll-mt-20 font-mono text-white overflow-x-hidden"
    >
      <style>{cyberStyles}</style>

      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">

        {/* ── Header ── */}
        <div className="mb-12 md:mb-20 text-center px-2">
          <div className="inline-block border border-[#50fa7b]/30 bg-[#50fa7b]/10 px-3 sm:px-4 py-1.5 text-[#50fa7b] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6">
            [ SYSTEM_LOGS ]
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold uppercase tracking-tighter mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
            Mission <span className="text-[#50fa7b]">Archive</span>
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base uppercase tracking-[0.15em] sm:tracking-[0.2em] max-w-2xl mx-auto leading-relaxed">
            Decrypted timeline of past network events and training modules.
          </p>
          {firestoreEvents.length > 0 && (
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#50fa7b] animate-pulse" />
              <span className="text-[9px] text-[#50fa7b] uppercase tracking-widest font-bold">
                {firestoreEvents.length} new op{firestoreEvents.length > 1 ? "s" : ""} · live sync
              </span>
            </div>
          )}
        </div>

        {/* ── Timeline ── */}
        <div className="relative">

          {/* Vertical line — always left-aligned on mobile, centred on md+ */}
          {mounted && (
            <div className="absolute left-[15px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#50fa7b] via-[#00d2ff] to-transparent md:-translate-x-[1px] animate-line origin-top" />
          )}

          <div className="space-y-8 sm:space-y-12 md:space-y-24">
            {events.map((event, index) => {
              const isEven = index % 2 === 0;

              return (
                <div
                  key={event.id}
                  // Mobile: always left-aligned. Desktop: alternating.
                  className={`relative flex items-start md:items-center
                    flex-row md:flex-row
                    ${isEven ? "md:flex-row-reverse" : ""}
                  `}
                >
                  {/* Glowing node */}
                  <div
                    className="absolute left-[11px] md:left-1/2 w-3 h-3 shrink-0
                      bg-[#0B111A] border-2 border-[#50fa7b] rounded-full
                      md:-translate-x-1/2 mt-5 md:mt-0 z-20 node-glow"
                  />

                  {/* Left spacer — desktop only */}
                  <div className="hidden md:block md:w-1/2" />

                  {/* Card — full width on mobile, half on desktop */}
                  <div
                    className={`
                      w-full md:w-1/2
                      pl-8 sm:pl-10 md:pl-0
                      ${isEven ? "md:pr-10 lg:pr-12" : "md:pl-10 lg:pl-12"}
                    `}
                  >
                    <div
                      onClick={() => setSelectedReport(event)}
                      className="bg-[#0B111A] border border-white/10 hover:border-[#50fa7b]/50
                        rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8
                        transition-all duration-300
                        hover:shadow-[0_0_30px_rgba(80,250,123,0.15)]
                        active:scale-[0.99]
                        hover:-translate-y-0.5 md:hover:-translate-y-1
                        group cursor-pointer"
                    >
                      {/* Date + category row */}
                      <div className="flex flex-wrap gap-2 items-center justify-between mb-3 sm:mb-4">
                        <span className="text-[#00d2ff] text-[9px] sm:text-[10px] font-bold tracking-wider break-all">
                          [{event.date}]
                        </span>
                        <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded border shrink-0 ${categoryStyle(event.category)}`}>
                          {event.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-wide text-white group-hover:text-[#50fa7b] transition-colors mb-2 leading-tight">
                        {event.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-400 text-[10px] sm:text-xs leading-relaxed line-clamp-2 mb-3 sm:mb-4">
                        {event.description}
                      </p>

                      {/* Footer row */}
                      <div className="border-t border-white/5 pt-3 sm:pt-4 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="text-gray-600 text-[8px] uppercase tracking-[0.2em] font-bold">
                            STATUS: {event.status}
                          </span>
                          {event.participants > 0 && (
                            <>
                              <span className="text-gray-700 hidden sm:inline">·</span>
                              <span className="text-[#00d2ff] text-[8px] uppercase tracking-widest font-bold">
                                {event.participants} operatives
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-[#50fa7b] text-[9px] uppercase tracking-widest font-bold group-hover:underline whitespace-nowrap">
                          READ_REPORT ↗
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* End of timeline */}
          <div className="relative mt-10 md:mt-24 flex justify-start md:justify-center pl-[11px] md:pl-0 z-20">
            <div className="w-3.5 h-3.5 bg-gray-800 border-2 border-gray-600 rounded-full" />
          </div>
          <div className="text-left md:text-center mt-3 pl-7 md:pl-0 text-gray-600 text-[8px] uppercase tracking-[0.3em] font-bold">
            END OF RECORD
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          AFTER-ACTION REPORT MODAL
      ══════════════════════════════════════ */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4 md:p-6"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="modal-enter w-full sm:max-w-4xl bg-[#0B111A] border border-[#50fa7b]/40
              rounded-t-2xl sm:rounded-xl overflow-hidden
              shadow-[0_0_50px_rgba(80,250,123,0.15)] flex flex-col"
            style={{ maxHeight: "92vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Terminal bar */}
            <div className="bg-[#050608] px-3 sm:px-4 py-3 flex justify-between items-center border-b border-[#50fa7b]/20 shrink-0">
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5555]" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#f1fa8c]" />
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#50fa7b]" />
              </div>
              <div className="text-[#50fa7b] text-[8px] sm:text-[10px] font-mono tracking-widest uppercase truncate px-2 sm:px-4 min-w-0">
                /archive/{selectedReport.id}.log
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-gray-500 hover:text-white font-bold text-base sm:text-lg leading-none shrink-0 p-1"
              >✕</button>
            </div>

            {/* Scrollable body */}
            <div className="modal-body flex-1 p-4 sm:p-6 md:p-8 relative">

              {/* Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12vw] font-black text-white/[0.02] pointer-events-none -rotate-45 uppercase tracking-widest whitespace-nowrap select-none">
                DECLASSIFIED
              </div>

              {/* Report header */}
              <div className="mb-5 sm:mb-8 relative z-10">
                <div className="inline-block bg-[#00d2ff]/10 text-[#00d2ff] border border-[#00d2ff]/30 px-2 sm:px-3 py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-2 sm:mb-3">
                  AFTER-ACTION REPORT
                </div>
                <h2 className="text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-2 leading-tight">
                  {selectedReport.title}
                </h2>
                <div className="text-gray-400 text-[9px] sm:text-xs tracking-widest uppercase flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4">
                  <span>DATE: {selectedReport.date}</span>
                  <span className="hidden sm:inline text-gray-600">|</span>
                  <span className="text-gray-500">📍 {selectedReport.venue}</span>
                </div>
              </div>

              {/* Data grid — stacked on mobile, 2-col on md+ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8 relative z-10">

                {/* Mission execution */}
                <div className="bg-[#050608] border border-white/5 rounded-lg p-4 sm:p-5">
                  <h3 className="text-[#ffb86c] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mb-2 sm:mb-3 border-b border-white/5 pb-2">
                    &gt; Mission_Execution
                  </h3>
                  <p className="text-gray-300 text-[10px] sm:text-xs leading-relaxed mb-3 sm:mb-4">
                    {selectedReport.description}
                  </p>
                  {selectedReport.outcome && (
                    <div className="bg-[#50fa7b]/5 border border-[#50fa7b]/20 rounded p-2.5 sm:p-3">
                      <h4 className="text-[#50fa7b] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-1">Final_Outcome</h4>
                      <p className="text-gray-400 text-[9px] sm:text-[10px] leading-relaxed">{selectedReport.outcome}</p>
                    </div>
                  )}
                </div>

                {/* Personnel & metrics */}
                <div className="flex flex-col gap-3 sm:gap-4">

                  {/* Participant count */}
                  {selectedReport.participants > 0 && (
                    <div className="bg-[#050608] border border-white/5 rounded-lg p-4 sm:p-5 flex items-center justify-between">
                      <div>
                        <h3 className="text-[#00d2ff] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                          Active_Participants
                        </h3>
                        <p className="text-gray-500 text-[8px] sm:text-[9px] uppercase tracking-widest">Total Operatives Deployed</p>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white">{selectedReport.participants}</div>
                    </div>
                  )}

                  {/* Personnel */}
                  <div className="bg-[#050608] border border-white/5 rounded-lg p-4 sm:p-5 flex-1">
                    <h3 className="text-[#bd93f9] text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mb-2 sm:mb-3 border-b border-white/5 pb-2">
                      &gt; Authorized_Personnel
                    </h3>
                    {selectedReport.faculty.length > 0 && (
                      <div className="mb-2 sm:mb-3">
                        <span className="text-gray-500 text-[8px] sm:text-[9px] uppercase tracking-widest block mb-1">Faculty Overseer(s):</span>
                        {selectedReport.faculty.map((name: string) => (
                          <div key={name} className="text-white text-[10px] sm:text-xs mb-0.5">• {name}</div>
                        ))}
                      </div>
                    )}
                    {selectedReport.students.length > 0 && (
                      <div>
                        <span className="text-gray-500 text-[8px] sm:text-[9px] uppercase tracking-widest block mb-1.5">Student Coordinators:</span>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {selectedReport.students.map((name: string) => (
                            <span key={name} className="bg-white/5 border border-white/10 text-gray-300 text-[8px] sm:text-[9px] px-2 py-1 rounded">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="bg-[#050608] px-4 sm:px-6 py-3 sm:py-4 border-t border-[#50fa7b]/20 flex justify-between items-center shrink-0">
              <div className="text-gray-500 text-[8px] sm:text-[9px] uppercase tracking-[0.2em] font-bold animate-pulse">
                _END_OF_REPORT
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="bg-transparent border border-[#50fa7b]/40 text-[#50fa7b] hover:bg-[#50fa7b] hover:text-black px-4 sm:px-6 py-2 rounded text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-colors"
              >
                Close_Terminal
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}