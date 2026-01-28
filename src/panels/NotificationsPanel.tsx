"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faTriangleExclamation,
  faExclamation,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { useNotifications } from "@/context/NotificationsContext";
import { Notification } from "@/db/schema";

export const NotificationsPanel = () => {
  const { payload, error, loading, acknowledge, resolve } = useNotifications();
  const [openIds, setOpenIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // refs for tabs
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const historyRef = useRef<HTMLButtonElement | null>(null);
  const tabsWrapRef = useRef<HTMLDivElement | null>(null);
  const [underlineStyle, setUnderlineStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const getColor = (level: Notification["level"]) => {
    switch (level) {
      case "low":
        return {
          icon: faCircle,
          cls: "text-emerald-300",
          bg: "bg-white/5 border border-emerald-400/40 hover:bg-white/10",
          text: "text-emerald-100",
        };
      case "medium":
        return {
          icon: faTriangleExclamation,
          cls: "text-amber-300",
          bg: "bg-white/5 border border-amber-400/40 hover:bg-white/10",
          text: "text-amber-100",
        };
      case "high":
        return {
          icon: faExclamation,
          cls: "text-rose-300",
          bg: "bg-white/5 border border-rose-400/40 hover:bg-white/10",
          text: "text-rose-100",
        };
    }
  };

  const acknowledgeNotification = useCallback(
    async (id: number) => {
      try {
        await acknowledge(id);
      } catch (err) {
        console.error("Failed to acknowledge notification", err);
      }
    },
    [acknowledge],
  );

  const resolveNotification = useCallback(
    async (id: number) => {
      try {
        await resolve(id);
      } catch (err) {
        console.error("Failed to resolve notification", err);
      }
    },
    [resolve],
  );

  const refreshUnderline = useCallback(() => {
    const el = activeTab === "active" ? activeRef.current : historyRef.current;
    if (el) {
      setUnderlineStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    refreshUnderline();
  }, [refreshUnderline]);

  useLayoutEffect(() => {
    const wrap = tabsWrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(() => refreshUnderline());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [refreshUnderline]);

  if (loading) return <p className="text-center text-white/70">Loading notifications…</p>;
  if (error) {
    return <p className="text-center text-red-500 text-xl">{error}</p>;
  }

  const toggleOpen = (id: number) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const activeRows = payload.active;
  const historyRows = payload.history;

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      {/* Tabs */}
      <div ref={tabsWrapRef} className="relative mb-6 border-b border-white/20">
        <div className="flex justify-center gap-6">
          <button
            ref={activeRef}
            onClick={() => setActiveTab("active")}
            className={clsx(
              "px-4 py-1 text-sm font-medium transition-colors",
              activeTab === "active" ? "text-white" : "text-white/70 hover:text-white",
            )}
          >
            Active Alerts
          </button>
          <button
            ref={historyRef}
            onClick={() => setActiveTab("history")}
            className={clsx(
              "px-4 py-1 text-sm font-medium transition-colors",
              activeTab === "history" ? "text-white" : "text-white/70 hover:text-white",
            )}
          >
            History
          </button>
        </div>

        {/* Sliding underline */}
        <span
          className="absolute bottom-0 h-0.5 bg-white/80 transition-all duration-300"
          style={{
            left: underlineStyle.left,
            width: underlineStyle.width,
          }}
        />
      </div>

      {/* Active Alerts */}
      {activeTab === "active" && (
        <div className="space-y-3">
          {activeRows.map((n) => {
            const badge = getColor(n.level);
            const isOpen = openIds.includes(n.id);
            const isAcknowledged = Boolean(n.acknowledgedAt);

            return (
              <div key={n.id} className="space-y-2">
                <div
                  onClick={() => toggleOpen(n.id)}
                  className={clsx(
                    "rounded px-3 py-2 cursor-pointer flex items-center gap-3",
                    badge?.bg,
                    badge?.text ?? "text-white",
                    isOpen && "ring-2 ring-white/60",
                  )}
                >
                  <div
                    className={clsx(
                      "w-5 h-5 grid place-items-center rounded-full border border-white/20",
                      badge?.cls,
                    )}
                  >
                    {badge ? <FontAwesomeIcon className="text-[0.55rem]" icon={badge.icon} /> : null}
                  </div>

                  <p className="flex-1 min-w-0 font-semibold sm:break-words lg:break-words" title={n.title}>
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
                  <div className="bg-zinc-900 rounded-lg p-3 text-sm text-white space-y-3">
                    <div className="font-bold text-lg">{n.title}</div>
                    <div className="opacity-80">
                      Level: {n.level} • {new Date(n.createdAt).toLocaleString()}
                    </div>
                    <p>{n.message}</p>

                    <div className="space-y-2 pt-2">
                      <div className="flex flex-col items-end gap-2 text-xs text-white/70">
                        {n.acknowledgedAt && (
                          <p>Acknowledged: {new Date(n.acknowledgedAt).toLocaleString()}</p>
                        )}
                        {n.resolvedAt && (
                          <p>Resolved: {new Date(n.resolvedAt).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          {n.level === "high" && (
                            <button
                              type="button"
                            onClick={() =>
                              window.dispatchEvent(
                                new CustomEvent("show-failure-tree", {
                                  detail: { notificationId: n.id, title: n.title, level: n.level },
                                }),
                              )
                            }
                              className={clsx(
                                "px-3 py-1 rounded text-xs font-semibold transition-colors",
                                "border border-rose-300/40 bg-rose-500/10 text-rose-100 hover:border-rose-300/70 hover:bg-rose-500/20",
                              )}
                            >
                              View Failure Tree
                            </button>
                          )}
                        </div>
                        {!n.resolvedAt && (
                          <button
                            onClick={() =>
                              isAcknowledged ? resolveNotification(n.id) : acknowledgeNotification(n.id)
                            }
                            className={clsx(
                              "px-3 py-1 rounded text-xs font-semibold transition-colors",
                              "bg-white/15 hover:bg-white/25 text-white",
                            )}
                          >
                            {isAcknowledged ? "Resolve" : "Acknowledge"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {activeRows.length === 0 && (
            <p className="text-center text-white/70">No active alerts</p>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {historyRows.map((n) => {
            const badge = getColor(n.level);
            const isOpen = openIds.includes(n.id);

            return (
              <div key={n.id} className="space-y-2">
                <div
                  onClick={() => toggleOpen(n.id)}
                  className={clsx(
                    "rounded px-3 py-2 cursor-pointer flex items-center gap-3",
                    badge?.bg,
                    badge?.text ?? "text-white",
                    isOpen && "ring-2 ring-white/60",
                  )}
                >
                  <div
                    className={clsx(
                      "w-5 h-5 grid place-items-center rounded-full border border-white/20",
                      badge?.cls,
                    )}
                  >
                    {badge ? <FontAwesomeIcon className="text-[0.55rem]" icon={badge.icon} /> : null}
                  </div>

                  <p className="flex-1 min-w-0 font-semibold sm:break-words lg:break-words" title={n.title}>
                    {n.title}
                  </p>

                  <div className="text-right text-xs text-white/60">
                    <div>{new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>

                {isOpen && (
                  <div className="bg-zinc-900 rounded-lg p-3 text-sm text-white space-y-3">
                    <div>
                      <div className="font-bold text-lg">{n.title}</div>
                      <div className="opacity-80">
                        Level: {n.level} • {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <p>{n.message}</p>
                    <div className="text-xs text-white/70 space-y-1">
                      <div>
                        Acknowledged: {n.acknowledgedAt ? new Date(n.acknowledgedAt).toLocaleString() : "—"}
                      </div>
                      <div>Resolved: {n.resolvedAt ? new Date(n.resolvedAt).toLocaleString() : "—"}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {historyRows.length === 0 && (
            <p className="text-center text-white/70">No resolved alerts</p>
          )}
        </div>
      )}
    </div>
  );
};
