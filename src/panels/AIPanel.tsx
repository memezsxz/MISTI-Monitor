"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
    code: ({ inline, children }) => {
        const text = String(children);
        const treatAsBlock = !inline && /\n/.test(text);
        if (treatAsBlock) {
            return (
                <pre className="bg-black/60 rounded-xl border border-white/10 p-3 mb-3 overflow-x-auto text-[0.9em] whitespace-pre-wrap">
                    <code className="font-mono text-white/90">{text}</code>
                </pre>
            );
        }
        return (
            <code className="px-1 py-0.5 rounded bg-white/10 text-[0.92em] font-mono text-white/90">
                {text}
            </code>
        );
    },
    h1: ({ children }) => (
        <h1 className="text-base font-semibold text-white/90 mb-2 mt-3 first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-sm font-semibold text-white mb-2 mt-3 first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-sm font-semibold text-white/90 mb-1 mt-2 first:mt-0">{children}</h3>
    ),
    table: ({ children }) => (
        <div className="overflow-x-auto mb-3">
            <table className="w-full text-left border-collapse text-xs">{children}</table>
        </div>
    ),
    th: ({ children }) => (
        <th className="border-b border-white/20 px-2 py-1 text-white/90 font-semibold">{children}</th>
    ),
    td: ({ children }) => (
        <td className="border-b border-white/10 px-2 py-1 text-white/80 align-top">{children}</td>
    ),
};
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPaperPlane,
    faWandMagicSparkles,
    faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { ChatHistoryDialog, type AiChatRow } from "@/components/ChatHistoryDialog";

export const AIPanel = () => {
    const [input, setInput] = useState("");
    const [lastQuestion, setLastQuestion] = useState<string | null>(null);
    const [lastAnswer, setLastAnswer] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [historyOpen, setHistoryOpen] = useState(false);

    const responseMarkdown: string | null = useMemo(() => {
        if (!lastQuestion) return null;
        return lastAnswer ?? "Generating answer...";
    }, [lastQuestion, lastAnswer]);

    async function submit() {
        const trimmed = input.trim();
        if (!trimmed || saving) return;

        setSaving(true);
        setLastQuestion(trimmed);
        setLastAnswer(null);
        setInput("");

        try {
            const res = await fetch("/api/ai-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: trimmed }),
            });

            if (!res.ok) throw new Error(await res.text());
            const data = (await res.json()) as { answer?: string };
            const answerText = (data.answer ?? "").trim();
            if (!answerText) throw new Error("Empty response from AI.");
            setLastAnswer(answerText);
        } catch (e) {
            console.error(e);
            setLastAnswer("AI unavailable.\n\nUnable to fetch a response right now. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    function selectFromHistory(row: AiChatRow) {
        setLastQuestion(row.question);

        setLastAnswer(row.answer);
    }

    return (
        <div className="w-full h-full flex flex-col gap-6">
            <ChatHistoryDialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                onSelect={selectFromHistory}
            />

            {/* Input Bar */}
            <div className="w-full rounded-2xl bg-zinc-900/70 border border-white/10 shadow-lg">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        type="button"
                        onClick={() => setHistoryOpen(true)}
                        className={clsx(
                            "shrink-0 h-10 w-10 rounded-xl",
                            "bg-white/10 hover:bg-white/15 active:bg-white/20",
                            "border border-white/10 grid place-items-center transition"
                        )}
                        aria-label="Open history"
                        title="History"
                    >
                        <FontAwesomeIcon icon={faClockRotateLeft} className="text-white/80 text-sm" />
                    </button>

                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") submit();
                        }}
                        placeholder="Question"
                        className={clsx(
                            "flex-1 min-w-0 bg-transparent outline-none",
                            "text-white/90 placeholder:text-white/40",
                            "text-sm"
                        )}
                    />

                    <button
                        type="button"
                        onClick={submit}
                        disabled={saving}
                        className={clsx(
                            "shrink-0 h-10 w-10 rounded-xl",
                            "bg-white/10 hover:bg-white/15 active:bg-white/20",
                            "border border-white/10 grid place-items-center transition",
                            saving && "opacity-60 cursor-not-allowed"
                        )}
                        aria-label="Send"
                        title="Send"
                    >
                        <FontAwesomeIcon icon={faPaperPlane} className="text-white/80 text-sm" />
                    </button>
                </div>
            </div>

            {/* AI Response */}
            <div className="flex items-start gap-3">
                <div className="shrink-0 h-9 w-9 rounded-full bg-white/5 border border-white/10 grid place-items-center">
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="text-white/70 text-sm" />
                </div>

                <div className="flex-1 min-w-0">
                    {lastQuestion && responseMarkdown ? (
                        <div className="space-y-3">
                            <div className="text-white/70 text-xs">
                                Based on: <span className="text-white/85">{lastQuestion}</span>
                            </div>
                            <div className="prose prose-invert max-w-none text-white/80 text-sm leading-6">
                                <ReactMarkdown components={markdownComponents}>
                                    {responseMarkdown}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div className="text-white/50 text-sm leading-6">
                            Ask a question to get a structured response (issue, cause, sensors, protocol).
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
