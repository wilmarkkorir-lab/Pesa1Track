import { useEffect, useState } from "react";
import { getQueue } from "../api/offlineQueue";
import { replayQueue } from "../api/http";

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [queued, setQueued] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const refreshCount = () => getQueue().then(q => setQueued(q.length)).catch(() => {});

  useEffect(() => {
    refreshCount();

    const goOnline = () => { setOnline(true); refreshCount(); };
    const goOffline = () => { setOnline(false); refreshCount(); };
    const onSynced = () => { refreshCount(); setJustSynced(true); setTimeout(() => setJustSynced(false), 3000); };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("pesatrack:synced", onSynced);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("pesatrack:synced", onSynced);
    };
  }, []);

  const syncNow = async () => {
    setSyncing(true);
    await replayQueue();
    await refreshCount();
    setSyncing(false);
  };

  if (online && queued === 0 && !justSynced) return null;

  if (justSynced) return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-semibold">
      <i className="bi bi-check-circle" /> All changes synced successfully
    </div>
  );

  if (!online) return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-800 text-white px-4 py-3 flex items-center justify-between text-sm md:left-64">
      <span className="flex items-center gap-2">
        <i className="bi bi-wifi-off text-yellow-400" />
        <span>You're offline. Changes will sync when you reconnect.</span>
        {queued > 0 && <span className="bg-yellow-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">{queued} pending</span>}
      </span>
    </div>
  );

  if (online && queued > 0) return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 flex items-center justify-between text-sm md:left-64">
      <span className="flex items-center gap-2">
        <i className="bi bi-arrow-repeat" />
        <span>{queued} change{queued !== 1 ? "s" : ""} waiting to sync</span>
      </span>
      <button className="bg-white text-blue-600 font-bold px-3 py-1 rounded-full text-xs" onClick={syncNow} disabled={syncing}>
        {syncing ? "Syncing…" : "Sync now"}
      </button>
    </div>
  );

  return null;
}
