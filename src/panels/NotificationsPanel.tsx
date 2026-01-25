"use client";

import { useEffect, useRef, useState } from "react";
import { Notification } from "@/db/schema";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faTriangleExclamation,
  faExclamation,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";

export const NotificationsPanel = () => {
  const [rows, setRows] = useState<Notification[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [acknowledgedIds, setAcknowledgedIds] = useState<number[]>([]);

  const cacheRef = useRef<{ data: Notification[]; ts: number } | null>(null);

  // refs for tabs
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const historyRef = useRef<HTMLButtonElement | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  // audio ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { 
    const initAudio = () => { 
      audioRef.current = new Audio("/alert.mp3"); 
      document.removeEventListener("click", initAudio); 
    }; 
    document.addEventListener("click", initAudio); 
  }, []);



  const getColor = (level: Notification["level"]) => {
    switch (level) {
      case "low":
        return {
          icon: faCircle,
          cls: "text-green-300",
          bg: "bg-green-700 hover:bg-green-600",
        };
      case "medium":
        return {
          icon: faTriangleExclamation,
          cls: "text-yellow-300",
          bg: "bg-yellow-700 hover:bg-yellow-600",
        };
      case "high":
        return {
          icon: faExclamation,
          cls: "text-red-300",
          bg: "bg-red-700 hover:bg-red-600",
        };
    }
  };

  const acknowledgeNotification = (id: number) => {
    setAcknowledgedIds((prev) => [...prev, id]);
    // stop sound
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    console.log(`Acknowledged notification ${id}`);
  };

  const resolveNotification = (notif: Notification) => {
    setHistory((prev) => [...prev, notif]);
    setRows((prev) => prev.filter((n) => n.id !== notif.id));
  };

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      const now = Date.now();
      if (cacheRef.current && now - cacheRef.current.ts < 5000) {
        if (active) setRows(cacheRef.current.data);
        return;
      }

      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Notification[];
        if (!active) return;

        // detect new notifications
        /*
        const newIds = data.map(d => d.id); 
        const oldIds = rows.map(r => r.id); 
        const hasNew = newIds.some(id => !oldIds.includes(id)); 
        if (hasNew) { audioRef.current = new Audio("/alert.mp3"); 
          audioRef.current.loop = true; 
          audioRef.current.play().catch(() => { 
            console.log("Sound play blocked until user interacts with page"); 
          }); } 
          */

        cacheRef.current = { data, ts: Date.now() };
        setRows(data);
        setError(null);
      } catch {
        if (active) setError("Could not fetch notifications from the database.");
      }
    };

    fetchData();
    const intervalId = window.setInterval(fetchData, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [rows]);

  useEffect(() => {
    const el = activeTab === "active" ? activeRef.current : historyRef.current;
    if (el) {
      setUnderlineStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeTab]);

  if (error) {
    return <p className="text-center text-red-500 text-xl">{error}</p>;
  }

  const toggleOpen = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      {/* Tabs */}
      <div className="flex justify-center mb-6 relative border-b border-white/20">
        <button
          ref={activeRef}
          onClick={() => setActiveTab("active")}
          className={clsx(
            "px-4 py-1 text-sm font-medium transition-colors",
            activeTab === "active"
              ? "text-blue-500"
              : "text-white/70 hover:text-white"
          )}
        >
          Active Alerts
        </button>
        <button
          ref={historyRef}
          onClick={() => setActiveTab("history")}
          className={clsx(
            "px-4 py-1 text-sm font-medium transition-colors",
            activeTab === "history"
              ? "text-blue-500"
              : "text-white/70 hover:text-white"
          )}
        >
          History
        </button>

        {/* Sliding underline */}
        <span
          className="absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300"
          style={{
            left: underlineStyle.left,
            width: underlineStyle.width,
          }}
        />
      </div>

      {/* Active Alerts */}
      {activeTab === "active" && (
        <div className="space-y-3">
          {rows.map((n) => {
            const badge = getColor(n.level);
            const isOpen = openIds.includes(n.id);

            return (
              <div key={n.id} className="space-y-2">
                <div
                  onClick={() => toggleOpen(n.id)}
                  className={clsx(
                    "rounded px-3 py-2 cursor-pointer text-white flex items-center gap-3",
                    badge?.bg,
                    isOpen && "ring-2 ring-white/60"
                  )}
                >
                  <div
                    className={clsx(
                      "w-5 h-5 grid place-items-center rounded-full border border-white/20",
                      badge?.cls
                    )}
                  >
                    {badge ? (
                      <FontAwesomeIcon
                        className="text-[0.55rem]"
                        icon={badge.icon}
                      />
                    ) : null}
                  </div>

                  <p
                    className="flex-1 min-w-0 font-semibold sm:break-words lg:break-words"
                    title={n.title}
                  >
                    {n.title}
                  </p>

                  <p className="shrink-0 text-xs text-white/70">
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {isOpen && (
                  <div className="bg-zinc-900 rounded-lg p-3 text-sm text-white space-y-2">
                    <div className="font-bold text-lg">{n.title}</div>
                    <div className="opacity-80">
                      Level: {n.level} •{" "}
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                    <p>{n.message}</p>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => acknowledgeNotification(n.id)}
                        className={clsx(
                          "px-3 py-1 rounded text-xs font-semibold transition-colors",
                          acknowledgedIds.includes(n.id)
                            ? "bg-gray-600 text-white cursor-default"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        )}
                        disabled={acknowledgedIds.includes(n.id)}
                      >
                        {acknowledgedIds.includes(n.id)
                          ? "Acknowledged"
                          : "Acknowledge"}
                      </button>
                      <button
                        onClick={() => resolveNotification(n)}
                        className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-xs font-semibold"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="text-center text-white/70">No active alerts</p>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {history.map((h) => (
            <div
              key={h.id}
              className="bg-zinc-800 rounded p-3 text-sm text-white space-y-1"
            >
              <div className="font-semibold">{h.title}</div>
              <div className="opacity-70 text-xs">
                Level: {h.level} • {new Date(h.createdAt).toLocaleString()}
              </div>
              <p>{h.message}</p>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-center text-white/70">No resolved alerts</p>
          )}
        </div>
      )}
    </div>
  );
};
