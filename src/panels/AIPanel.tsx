"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPaperPlane,
    faWandMagicSparkles,
    faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { ChatHistoryDialog, type AiChatRow } from "@/components/ChatHistoryDialog";

type AIResponse = {
    title: string;
    bullets: string[];
};

function buildDemoAnswer(question: string): AIResponse {
    const q = question.toLowerCase();

    if (q.includes("flow")) {
        return {
            title: "Here’s what I can help with",
            bullets: [
                "What the issue is (flow abnormality, drop, instability)",
                "Why it is happening (blockage, cavitation, valve position, pump speed)",
                "What sensors are involved (flow + temperature correlation)",
                "Protocol (safety stop → isolate → verify valves → check supply → restart)",
            ],
        };
    }

    if (q.includes("temperature") || q.includes("temp")) {
        return {
            title: "Here’s what I can help with",
            bullets: [
                "What the issue is (temperature drift / overshoot)",
                "Why it is happening (heater control, insulation, mixing, sensor placement)",
                "What sensors are involved (temperature + flow cross-check)",
                "Protocol (reduce heat → verify probe position → confirm setpoints)",
            ],
        };
    }

    return {
        title: "Here’s what I can help with",
        bullets: [
            "What the issue is",
            "Why it is happening",
            "What sensors are involved",
            "Protocol",
        ],
    };
}

export const AIPanel = () => {
    const [input, setInput] = useState("");
    const [lastQuestion, setLastQuestion] = useState<string | null>(null);
    const [lastAnswer, setLastAnswer] = useState<AIResponse | null>(null);
    const [saving, setSaving] = useState(false);

    const [historyOpen, setHistoryOpen] = useState(false);

    const response: AIResponse | null = useMemo(() => {
        if (!lastQuestion) return null;
        return lastAnswer ?? buildDemoAnswer(lastQuestion);
    }, [lastQuestion, lastAnswer]);

    async function submit() {
        const trimmed = input.trim();
        if (!trimmed || saving) return;

        setSaving(true);
        setLastQuestion(trimmed);

        // demo answer for now (later you replace with real AI)
        const demo = buildDemoAnswer(trimmed);
        setLastAnswer(demo);
        setInput("");

        // Save Q/A to DB
        try {
            const res = await fetch("/api/ai-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: trimmed,
                    answer: [demo.title, ...demo.bullets.map((b) => `- ${b}`)].join("\n"),
                }),
            });

            if (!res.ok) throw new Error(await res.text());
        } catch (e) {
            console.error(e);
            // keep UI response, just fail silently for now (or show a toast)
        } finally {
            setSaving(false);
        }
    }

    function selectFromHistory(row: AiChatRow) {
        setLastQuestion(row.question);

        // If you saved answer as text, show it as bullets-like display:
        const lines = row.answer.split("\n").map((l) => l.trim()).filter(Boolean);
        const title = lines[0] ?? "AI Response";
        const bullets = lines.slice(1).map((l) => l.replace(/^- /, ""));
        setLastAnswer({ title, bullets });
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
                    {lastQuestion ? (
                        <>
                            <div className="text-white/70 text-xs mb-2">
                                Based on: <span className="text-white/85">{lastQuestion}</span>
                            </div>

                            <div className="text-white/90 text-sm font-semibold mb-2">
                                {response?.title ?? "AI Response"}
                            </div>

                            <ul className="space-y-2 text-white/80 text-sm">
                                {(response?.bullets ?? []).map((b, i) => (
                                    <li key={i} className="leading-6">
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </>
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
