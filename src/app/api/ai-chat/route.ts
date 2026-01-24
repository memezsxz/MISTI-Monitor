export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { aiChat } from "@/db/schema/ai_chat";

type Body = {
    question: string;
    answer: string;
};

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as Body;

        const question = (body.question ?? "").trim();
        const answer = (body.answer ?? "").trim();

        if (!question) return NextResponse.json({ error: "question is required" }, { status: 400 });
        if (!answer) return NextResponse.json({ error: "answer is required" }, { status: 400 });

        const inserted = await db.insert(aiChat).values({ question, answer }).returning();
        return NextResponse.json(inserted[0]);
    } catch (err) {
        console.error("POST /api/ai-chat failed:", err);
        return NextResponse.json({ error: "Failed to save chat message." }, { status: 500 });
    }
}
