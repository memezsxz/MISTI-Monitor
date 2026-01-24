import {NextResponse} from "next/server";

export const runtime = "nodejs";

import { db } from "@/db/db";
import { notifications } from "@/db/schema";
import {desc} from "drizzle-orm";

export async function GET() {
    try {
        const rows = await db
            .select()
            .from(notifications)
            .orderBy(desc(notifications.createdAt))
            .limit(5)
        ;

        return NextResponse.json(rows);
    } catch (err) {
        console.error("GET /api/notifications failed:", err);
        return NextResponse.json(
            { error: String(err) },
            { status: 500 }
        );
    }
}
