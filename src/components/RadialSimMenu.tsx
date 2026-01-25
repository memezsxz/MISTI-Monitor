"use client";

import {useEffect, useRef, useState} from "react";

type RadialOption = {
    id: string;
    label: string;
};

export const RadialSimMenu = ({
    options,
    onSelect,
}: {
    options: RadialOption[];
    onSelect?: (id: string) => void;
}) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

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
                                onSelect?.(option.id);
                                setOpen(false);
                            }}
                            className={`absolute right-0 bottom-1/3 translate-y-1/2 rounded-full border border-white/10 bg-zinc-800/90 px-3 py-1 text-[11px] font-semibold text-white/80 shadow-sm transition-all duration-200 ease-out ${
                                open ? "opacity-100" : "opacity-0 pointer-events-none"
                            } hover:scale-105 hover:border-white/30 hover:bg-white/10 hover:text-white`}
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
