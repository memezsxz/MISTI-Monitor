"use client";

import {useEffect, useRef, useState} from "react";
import {getCacheWindowMs} from "@/lib/dataRefresh";

type RadialOption = {
    id: string;
    label: string;
};

export const RadialSimMenu = ({
    options,
    onSelect,
    defaultScenarioId,
}: {
    options: RadialOption[];
    onSelect?: (id: string) => void;
    defaultScenarioId?: string;
}) => {
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(defaultScenarioId ?? null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const hasSeededRef = useRef(false);
    const pendingRef = useRef(false);

    async function seedScenario(id: string, opts: { silent?: boolean } = {}) {
        const { silent = false } = opts;
        if (pendingRef.current && silent) return;
        pendingRef.current = true;
        if (!silent) setLoadingId(id);
        try {
            await fetch("/api/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scenario: id }),
            });
            setActiveId(id);
            onSelect?.(id);
        } catch (err) {
            console.error("Failed to seed scenario", err);
        } finally {
            if (!silent) {
                setLoadingId((curr) => (curr === id ? null : curr));
            }
            pendingRef.current = false;
        }
    }

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        const onClickAway = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClickAway);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClickAway);
        };
    }, []);

    useEffect(() => {
        const initialId = defaultScenarioId ?? options[0]?.id;
        if (!initialId || hasSeededRef.current) return;
        hasSeededRef.current = true;
        seedScenario(initialId).catch((err) => console.error(err));
    }, [defaultScenarioId, options.length]);

    useEffect(() => {
        if (!activeId) return;
        const intervalId = window.setInterval(() => {
            seedScenario(activeId, { silent: true }).catch((err) => console.error(err));
        }, getCacheWindowMs());
        return () => window.clearInterval(intervalId);
    }, [activeId]);

    return (
        <div
            ref={rootRef}
            className="fixed bottom-1 right-3 z-40 flex items-center justify-center"
        >
            <div className="relative h-48 w-32">
                {options.map((option, index) => {
                    const gap = 40;
                    const offsetY = open ? (index + 1) * gap : 0;
                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                                seedScenario(option.id).catch((err) => console.error(err));
                                setOpen(false);
                            }}
                            disabled={!!loadingId}
                            className={`absolute right-0 bottom-1/3 translate-y-1/2 rounded-full border px-3 py-1 text-[11px] font-semibold shadow-sm transition-all duration-200 ease-out ${
                                open ? "opacity-100" : "opacity-0 pointer-events-none"
                            } ${
                                activeId === option.id
                                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-50"
                                    : "border-white/10 bg-zinc-800/90 text-white/80 hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white"
                            } ${loadingId ? "cursor-wait" : ""}`}
                            style={{
                                transform: `translateY(-${offsetY}px)`,
                            }}
                            aria-hidden={!open}
                        >
                            {option.label}
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-label="Toggle simulation options"
                    className="absolute bottom-2 right-0 h-14 w-14 rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white/90 shadow-md transition hover:scale-105 hover:border-white/30 hover:bg-white/20"
                >
                    Sim
                </button>
            </div>
        </div>
    );
};
