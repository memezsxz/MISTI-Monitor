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
  const [error, setError] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<number[]>([]);
  const cacheRef = useRef<{ data: Notification[]; ts: number } | null>(null);

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
  }, []);

  if (error) {
    return <p className="text-center text-red-500 text-xl">{error}</p>;
  }

  const toggleOpen = (id: number) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 space-y-3">
      {rows.map((n) => {
        const badge = (() => {
          switch (n.level) {
            case "low": return { icon: faCircle, cls: "text-green-300" };
            case "medium": return { icon: faTriangleExclamation, cls: "text-yellow-300" };
            case "high": return { icon: faExclamation, cls: "text-red-300" };
          }
        })();

        const isOpen = openIds.includes(n.id);

        return (
          <div key={n.id} className="space-y-2">
            {/* Notification row */}
            <div
              onClick={() => toggleOpen(n.id)}
              className={clsx(
                "rounded px-3 py-2 cursor-pointer text-white flex items-center gap-3",
                n.level === "low" && "bg-green-700 hover:bg-green-600",
                n.level === "medium" && "bg-yellow-700 hover:bg-yellow-600",
                n.level === "high" && "bg-red-700 hover:bg-red-600",
                isOpen && "ring-2 ring-white/60"
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 grid place-items-center rounded-full border border-white/20",
                  badge.cls
                )}
              >
                <FontAwesomeIcon className="text-[0.55rem]" icon={badge.icon} />
              </div>

              {/* Responsive text for title */}
              <p
                className="
                  flex-1 min-w-0 font-semibold 
                  sm:whitespace-normal sm:break-words
                  lg:whitespace-normal lg:break-words
                "
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

            {/* Inline details */}
            {isOpen && (
              <div className="bg-zinc-800 rounded-lg p-3 text-sm text-white space-y-2">
                <div className="font-bold text-lg">{n.title}</div>
                <div className="opacity-80">
                  Level: {n.level} •{" "}
                  {new Date(n.createdAt).toLocaleString()}
                </div>
                <p>{n.message}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
