"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

interface EventNode {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  status: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventNode[]>([]);
  const [categories, setCategories] = useState<string[]>(["ALL"]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const eventsRef = collection(db, "events");
        
        // 1. Fetch all events to determine unique categories dynamically
        const allSnapshot = await getDocs(eventsRef);
        const allData = allSnapshot.docs.map(doc => doc.data() as EventNode);
        
        // Create unique category list: ["ALL", "HACKATHON", "SEMINAR", ...]
        const uniqueCats = Array.from(new Set(allData.map(e => e.category.toUpperCase())));
        setCategories(["ALL", ...uniqueCats]);

        // 2. Fetch filtered events
        const q = filter === "ALL" 
          ? query(eventsRef, orderBy("date", "asc")) 
          : query(eventsRef, where("category", "==", filter.toLowerCase()), orderBy("date", "asc"));
        
        const querySnapshot = await getDocs(q);
        setEvents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EventNode[]);
        
      } catch (error) {
        console.error("REGISTRY_LOAD_ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050A14', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, fontFamily: 'monospace' }}>
            [ SYSTEM_EVENTS_REGISTRY ]
          </h1>
          <p style={{ color: '#8b949e', marginTop: '8px', fontSize: '14px' }}>
            Displaying active operations within the CHARUSAT network.
          </p>
        </div>

        {/* DYNAMIC CATEGORY BAR */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', overflowX: 'auto', paddingBottom: '10px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                padding: '10px 22px',
                backgroundColor: filter === cat ? 'rgba(80, 250, 123, 0.1)' : '#0B111A',
                border: `1px solid ${filter === cat ? '#50fa7b' : '#2a2e3f'}`,
                color: filter === cat ? '#50fa7b' : '#8b949e',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: 'monospace',
                transition: '0.3s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: '#50fa7b', fontFamily: 'monospace' }}>SCANNING_FREQUENCY...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {events.length > 0 ? events.map((event) => (
              <div key={event.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <span style={tagStyle}>{event.category.toUpperCase()}</span>
                  <span style={{ color: '#50fa7b', fontSize: '10px', fontWeight: 'bold' }}>
                    ● {event.status.toUpperCase()}
                  </span>
                </div>
                
                <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '12px', fontWeight: 'bold' }}>
                  {event.title}
                </h3>
                
                <p style={{ color: '#8b949e', fontSize: '13px', lineHeight: '1.6', marginBottom: '24px', minHeight: '60px' }}>
                  {event.description}
                </p>

                <div style={{ borderTop: '1px solid #2a2e3f', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#444', fontSize: '9px', fontWeight: 'bold' }}>SCHEDULED_DATE</span>
                    <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>{event.date}</span>
                  </div>
                  <button style={actionBtn}>DETAILS_&gt;</button>
                </div>
              </div>
            )) : (
              <div style={{ color: '#ff5555', fontFamily: 'monospace', gridColumn: '1/-1', textAlign: 'center', padding: '50px', border: '1px dashed #ff555533' }}>
                [ ERROR: NO_ACTIVE_NODES_FOUND_IN_THIS_SECTOR ]
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// --- STYLES ---
const cardStyle = {
  backgroundColor: '#0B111A',
  border: '1px solid #2a2e3f',
  borderRadius: '20px',
  padding: '30px',
  transition: 'all 0.3s ease',
};

const tagStyle = {
  fontSize: '9px',
  fontWeight: 'bold',
  color: '#50fa7b',
  backgroundColor: 'rgba(80, 250, 123, 0.05)',
  padding: '5px 10px',
  borderRadius: '6px',
  border: '1px solid rgba(80, 250, 123, 0.2)',
  letterSpacing: '1px'
};

const actionBtn = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#50fa7b',
  fontSize: '11px',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontFamily: 'monospace'
};