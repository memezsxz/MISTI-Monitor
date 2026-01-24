export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { aiChat } from "@/db/schema/ai_chat";
import { desc } from "drizzle-orm";

export async function GET() {
    const rows = await db
        .select()
        .from(aiChat)
        .orderBy(desc(aiChat.id))
        .limit(50);

    return NextResponse.json(rows);
}
