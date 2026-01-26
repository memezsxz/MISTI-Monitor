export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { aiChat } from "@/db/schema/ai_chat";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "llama3";

async function generateAnswer(prompt: string): Promise<string> {
    const baseUrl = (process.env.OLLAMA_URL ?? DEFAULT_OLLAMA_URL).replace(/\/$/, "");
    const model = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
    const res = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            prompt,
            stream: true,
        }),
    });

    if (!res.ok || !res.body) {
        const message = await res.text().catch(() => res.statusText);
        throw new Error(`Ollama request failed: ${res.status} ${message}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.response) {
                    full += parsed.response;
                }
            } catch (err) {
                console.warn("Failed to parse Ollama chunk:", err);
            }
        }
    }

    return full.trim();
}

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => ({}))) as { question?: string };
        const question = (body.question ?? "").trim();
        if (!question) {
            return NextResponse.json({ error: "question is required" }, { status: 400 });
        }

        const answer = await generateAnswer(question);
        if (!answer) {
            return NextResponse.json({ error: "AI did not return a response." }, { status: 502 });
        }

        const [inserted] = await db.insert(aiChat).values({ question, answer }).returning();
        return NextResponse.json(inserted);
    } catch (err) {
        console.error("POST /api/ai-chat failed:", err);
        return NextResponse.json({ error: "Failed to ask AI." }, { status: 500 });
    }
}
