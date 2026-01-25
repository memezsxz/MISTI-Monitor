"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Shift } from "@/db/schema/shifts";
import type { TurnoverNote } from "@/db/schema/turnover_notes";
import TextareaAutosize from 'react-textarea-autosize';


async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
    const r = await fetch(url, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });

    if (!r.ok) {
        const body = await r.text().catch(() => "");
        throw new Error(`[${r.status} ${r.statusText}] ${url}\n${body}`);
    }

    return (await r.json()) as T;
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type ListResponse<T> = { items: T[]; nextCursor?: string | null };

function asListResponse<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object" && "items" in data) {
        const items = (data as ListResponse<T>).items;
        return Array.isArray(items) ? items : [];
    }
    return [];
}

// If your API joins user name onto Shift rows, keep it optional
type ShiftRow = Shift & { userName?: string | null };

export const TurnoverPanel = () => {
    const [open, setOpen] = useState(true);

    const [shifts, setShifts] = useState<ShiftRow[]>([]);
    const [notesByShift, setNotesByShift] = useState<Record<string, TurnoverNote[]>>({});
    const [draftTextByShift, setDraftTextByShift] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    // only one open at a time (or none)
    const [expandedShiftId, setExpandedShiftId] = useState<number | null>(null);

    // scroll only when opening current shift
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const prevExpandedRef = useRef<number | null>(null);

    // track loaded shifts (to avoid re-fetching)
    const loadedShiftIdsRef = useRef<Set<number>>(new Set());

    const shiftsAsc = useMemo(() => {
        return [...shifts].sort(
            (a: Shift, b: Shift) =>
                new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        );
    }, [shifts]);

    const currentShiftId = useMemo(() => {
        return shiftsAsc.length ? shiftsAsc[shiftsAsc.length - 1].id : null;
    }, [shiftsAsc]);

    // const currentShiftId = useMemo(() => {
    //     return shiftsAsc.length ? shiftsAsc[shiftsAsc.length - 1].id : null;
    // }, [shiftsAsc]);

    // ---- fetch helpers ----
    async function fetchNotesList(shiftId: number) {
        const payload = await apiJson<unknown>(`/api/notes?shiftId=${shiftId}&limit=200`);
        return asListResponse<TurnoverNote>(payload);
    }

    async function loadNotes(shiftId: number) {
        const list = await fetchNotesList(shiftId);
        setNotesByShift((prev) => ({ ...prev, [String(shiftId)]: list }));
    }

    // load shifts + immediately load notes for the current shift (so first open shows data)
    useEffect(() => {
        apiJson<unknown>("/api/shift?limit=50")
            .then((payload) => {
                const list = asListResponse<ShiftRow>(payload);
                setShifts(list);

                // decide current (latest startedAt)
                const sorted = [...list].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
                const current = sorted.length ? sorted[sorted.length - 1].id : null;

                setExpandedShiftId(current);

                // ✅ preload current shift notes right away (no click needed)
                if (current != null && !loadedShiftIdsRef.current.has(current)) {
                    fetchNotesList(current)
                        .then((notes) => {
                            setNotesByShift((prev) => ({ ...prev, [String(current)]: notes }));
                            loadedShiftIdsRef.current.add(current);
                        })
                        .catch((e) => {
                            console.error(e);
                            setError("Could not fetch notes for the current shift.");
                        });
                }
            })
            .catch((e) => {
                console.error(e);
                setError("Could not fetch shifts.");
            });
    }, []);

    // scroll only when current shift was just opened
    useEffect(() => {
        const prev = prevExpandedRef.current;
        prevExpandedRef.current = expandedShiftId;

        const justOpenedCurrent =
            prev !== expandedShiftId && expandedShiftId != null && expandedShiftId === currentShiftId;

        if (!open || !justOpenedCurrent) return;

        requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        });
    }, [open, expandedShiftId, currentShiftId]);

    async function toggleShift(id: number) {
        const willOpen = expandedShiftId !== id;
        setExpandedShiftId((prev) => (prev === id ? null : id));

        if (!willOpen) return;

        if (loadedShiftIdsRef.current.has(id)) return;

        try {
            await loadNotes(id);
            loadedShiftIdsRef.current.add(id);
        } catch (e) {
            console.error(e);
            setError("Could not fetch notes for this shift.");
        }
    }

    function canEdit(shiftId: number) {
        return currentShiftId != null && shiftId === currentShiftId;
    }

    function setLocalNoteText(shiftId: number, noteId: number, text: string) {
        const key = String(shiftId);
        setNotesByShift((prev) => {
            const list = prev[key] ?? [];
            const next = list.map((n) => (n.id === noteId ? { ...n, text } : n));
            return { ...prev, [key]: next };
        });
    }

    async function persistNote(shiftId: number, noteId: number) {
        const key = String(shiftId);
        const list = notesByShift[key] ?? [];
        const note = list.find((n) => n.id === noteId);
        if (!note) return;

        const text = note.text.trim();

        if (!text) {
            await apiJson(`/api/notes/${noteId}`, { method: "DELETE" });
            await loadNotes(shiftId);
            return;
        }

        await apiJson(`/api/notes/${noteId}`, {
            method: "PATCH",
            body: JSON.stringify({ text }),
        });

        await loadNotes(shiftId);
    }

    async function createNote(shiftId: number) {
        const key = String(shiftId);
        const draft = (draftTextByShift[key] ?? "").trim();
        if (!draft) return;

        await apiJson(`/api/notes`, {
            method: "POST",
            body: JSON.stringify({ shiftId, text: draft }),
        });

        setDraftTextByShift((prev) => ({ ...prev, [key]: "" }));
        await loadNotes(shiftId);

        requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        });
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-white/80 hover:bg-zinc-900/80 transition"
            >
                Open Turnover
            </button>
        );
    }

    if (error) {
        console.error(error);
        return <p className="text-center text-red-500 text-xl">Could not fetch turnover data.</p>;
    }

    return (
        <div className="grid gap-3 w-full h-full">
            {shiftsAsc.map((shift) => {
                const expanded = expandedShiftId === shift.id;
                const isCurrent = currentShiftId === shift.id;
                const editable = canEdit(shift.id);

                const key = String(shift.id);
                const notes = notesByShift[key] ?? [];
                const draftText = draftTextByShift[key] ?? "";

                return (
                    <div key={shift.id} className="rounded-2xl border border-white/10 bg-zinc-950/80 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleShift(shift.id)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition text-left"
                        >
                            <div className="min-w-0 ">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold truncate">{shift.userName?.trim() || `User #${shift.userId}`}</span>

                                    {isCurrent && (
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-200 border border-emerald-300/20">
                      Current
                    </span>
                                    )}
                                </div>

                                <div className="text-xs text-white/60 mt-1 ">
                                    Start: {formatTime(shift.startedAt)}
                                    {shift.endedAt ? ` • End: ${formatTime(shift.endedAt)}` : " • End: —"}
                                </div>
                            </div>

                            <div className="text-white/60 text-sm">{expanded ? "▾" : "▸"}</div>
                        </button>

                        {expanded && (
                            <div className="px-4 pb-4 ">
                                <div className="relative pl-6 grid gap-3">
                                    <div className="absolute left-2 top-1 bottom-1 w-px bg-white/10" />

                                    {notes.map((n) => (
                                        <div key={n.id} className="relative">
                                            <div className="absolute -left-[2px] top-2 h-3 w-3 rounded-full bg-zinc-950 border border-white/15" />

                                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                                <div className="flex items-center justify-between gap-3 mb-2">
                                                    <div className="text-xs text-white/60">{formatTime(n.createdAt)}</div>
                                                </div>

                                                {editable ? (
                                                    <TextareaAutosize 
                                                    value={n.text} 
                                                    onChange={(e) => setLocalNoteText(shift.id, n.id, e.target.value)}
                                                    onBlur={() => persistNote(shift.id, n.id).catch(console.error)}
                                                    placeholder="Edit note…"
                                                    className={[
                                                        "w-full resize-none rounded-lg",
                                                        "bg-zinc-950/40 border border-white/10",
                                                        "px-3 py-2 text-sm text-white/90",
                                                        "placeholder:text-white/30",
                                                        "outline-none focus:ring-2 focus:ring-white/10",
                                                    ].join(" ")}
                                                    />
                                                ) : (
                                                    <p>{n.text}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {isCurrent && (
                                        <div className="relative">
                                            <div className="absolute -left-[2px] top-2 h-3 w-3 rounded-full bg-zinc-950 border border-white/15" />

                                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                                <div className="flex items-center justify-between gap-3 mb-2">
                                                    <div className="text-xs text-white/60">—</div>
                                                    <div className="text-[11px] text-white/45">Draft</div>
                                                </div>

                                                <TextareaAutosize
                                                value={draftText}
                                                onChange={(e) =>
                                                    setDraftTextByShift((prev) => ({
                                                        ...prev,
                                                        [key]: e.target.value,
                                                    }))
                                                }
                                                onBlur={() => createNote(shift.id).catch(console.error)}
                                                placeholder="Write a turnover note…"
                                                className={[
                                                    "w-full resize-none rounded-lg",
                                                    "bg-zinc-950/40 border border-white/10",
                                                    "px-3 py-2 text-sm text-white/90",
                                                    "placeholder:text-white/30",
                                                    "outline-none focus:ring-2 focus:ring-white/10",
                                                    ].join(" ")}
                                                    />


                                                {draftText.trim().length === 0 && (
                                                    <div className="mt-2 text-[11px] text-white/40">
                                                        This draft has no timestamp until you write something.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {isCurrent && <div ref={bottomRef} className="h-1" />}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
