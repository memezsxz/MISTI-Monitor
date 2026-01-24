"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

export type AiChatRow = {
    id: number;
    question: string;
    answer: string;
    createdAt: string;
};

function oneLinePreview(s: string, max = 60) {
    const single = s.replace(/\s+/g, " ").trim();
    return single.length > max ? single.slice(0, max) + "…" : single;
}

export function ChatHistoryDialog({
                                      open,
                                      onClose,
                                      onSelect,
                                  }: {
    open: boolean;
    onClose: () => void;
    onSelect: (row: AiChatRow) => void;
}) {
    const [rows, setRows] = useState<AiChatRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        setLoading(true);
        setError(null);

        fetch("/api/ai-chat/history")
            .then(async (r) => {
                if (!r.ok) throw new Error(await r.text());
                return r.json();
            })
            .then((data: AiChatRow[]) => setRows(data))
            .catch(() => setError("Could not load chat history."))
            .finally(() => setLoading(false));
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 ">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            <div className="absolute left-1/2 top-1/2 w-80 max-h-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-zinc-950 shadow-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="text-white/90 font-semibold">Chat History</div>
                    <button onClick={onClose} className="rounded-lg px-3 py-1 text-white/70 hover:bg-white/10">
                        Close
                    </button>
                </div>

                <div className="max-h-[50vh] overflow-y-auto p-3">
                    {loading && <div className="text-white/60 p-3">Loading…</div>}
                    {error && <div className="text-red-400 p-3">{error}</div>}

                    {!loading && !error && rows.length === 0 && (
                        <div className="text-white/60 p-3">No history yet.</div>
                    )}

                    <div className="grid gap-2">
                        {rows.map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                    onSelect(r);
                                    onClose();
                                }}
                                className={clsx(
                                    "w-74 text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition",
                                    "px-4 py-3"
                                )}
                            >
                                <div className="text-white/90 text-sm font-semibold truncate">
                                    Q: {oneLinePreview(r.question, 90)}
                                </div>
                                <div className="text-white/60 text-sm truncate">
                                    A: {oneLinePreview(r.answer, 120)}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
