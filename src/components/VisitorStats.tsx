
import React, { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, addDoc, collection, setDoc, serverTimestamp, query, where, Timestamp, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { Eye, Users } from 'lucide-react';

export default function VisitorStats() {
  const [count, setCount] = useState<number | null>(null);
  const [activeViewersCount, setActiveViewersCount] = useState<number>(0);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const sessionId = useRef(Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    const counterRef = doc(db, 'siteStats', 'visitors');
    const logsRef = collection(db, 'visitorLogs');
    const activeRef = doc(db, 'activeViewers', sessionId.current);

    // Initialize/Increment Total
    setDoc(counterRef, { count: increment(1) }, { merge: true })
        .catch((error) => handleFirestoreError(error, OperationType.WRITE, 'siteStats/visitors'));

    // Initial Logging and Heartbeat as general guest
    addDoc(logsRef, { sessionId: sessionId.current, entryTime: serverTimestamp() }).catch(console.error);
    setDoc(activeRef, { sessionId: sessionId.current, lastSeen: serverTimestamp() }).catch(console.error);

    // Track user identity changes to enrich heartbeat and log access by Gmail
    const unsubAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
            const isOwner = user.email === 'muhaiminzeeismail@gmail.com';
            // Log access by logged-in user
            addDoc(logsRef, {
                sessionId: sessionId.current,
                email: user.email,
                displayName: user.displayName,
                entryTime: serverTimestamp(),
                isLoggedIn: true,
                isOwner: isOwner
            }).catch(console.error);

            // Update session footprint with identity details
            setDoc(activeRef, {
                sessionId: sessionId.current,
                email: user.email,
                displayName: user.displayName,
                lastSeen: serverTimestamp(),
                isLoggedIn: true,
                isOwner: isOwner
            }, { merge: true }).catch(console.error);
        }
    });

    const updateHeartbeat = () => {
        const u = auth.currentUser;
        const payload: any = {
            sessionId: sessionId.current,
            lastSeen: serverTimestamp()
        };
        if (u) {
            payload.email = u.email;
            payload.displayName = u.displayName;
            payload.isLoggedIn = true;
            payload.isOwner = u.email === 'muhaiminzeeismail@gmail.com';
        }
        setDoc(activeRef, payload, { merge: true }).catch(console.error);
    };
    const heartbeatInterval = setInterval(updateHeartbeat, 30000);

    // Live update Total
    const unsub = onSnapshot(counterRef, (snapshot) => {
        if (snapshot.exists()) {
            setCount(snapshot.data().count);
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'siteStats/visitors');
    });

    // Active Viewers Snapshot - Subscribe to 15 minutes of dynamic footprint
    const activeColRef = collection(db, 'activeViewers');
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const q = query(activeColRef, where("lastSeen", ">=", Timestamp.fromDate(fifteenMinutesAgo)));
    const unsubActive = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActiveSessions(list);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'activeViewers');
    });

    return () => {
        unsub();
        unsubActive();
        unsubAuth();
        clearInterval(heartbeatInterval);
        // Optional: remove session on unmount or let it naturally timeout
    };
  }, []);

  useEffect(() => {
    const calcActiveCount = () => {
        const threshold = Date.now() - 2 * 60 * 1000;
        const active = activeSessions.filter(s => {
            if (!s.lastSeen) return true;
            const time = s.lastSeen.toDate ? s.lastSeen.toDate().getTime() : new Date(s.lastSeen).getTime();
            return time >= threshold;
        });
        setActiveViewersCount(active.length);
    };

    calcActiveCount();
    const interval = setInterval(calcActiveCount, 3000);
    return () => clearInterval(interval);
  }, [activeSessions]);

  return (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50/80 px-3 py-1.5 rounded-full border border-slate-150 shadow-3xs">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>{activeViewersCount} Aktif Semasa</span>
    </div>
  );
}
