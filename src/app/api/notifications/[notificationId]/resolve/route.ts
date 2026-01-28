import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db/db";
import { notifications } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(
    req: Request,
    { params }: { params?: Promise<{ notificationId: string }> },
) {
    try {
        const idParam = params ? (await params).notificationId : undefined;
        const id = Number(
            idParam ?? new URL(req.url).pathname.split("/").slice(-2, -1)[0],
        );

        if (!Number.isFinite(id) || id <= 0) {
            return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
        }

        const existing = await db
            .select()
            .from(notifications)
            .where(eq(notifications.id, id))
            .limit(1);

        if (!existing[0]) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        if (existing[0].resolvedAt) {
            return NextResponse.json(existing[0]);
        }

        const updates: Record<string, unknown> = {
            resolvedAt: sql`(datetime('now'))`,
        };

        if (!existing[0].acknowledgedAt) {
            updates.acknowledgedAt = sql`(datetime('now'))`;
        }

        const [updated] = await db
            .update(notifications)
            .set(updates)
            .where(eq(notifications.id, id))
            .returning();

        return NextResponse.json(updated);
    } catch (err) {
        console.error("POST /api/notifications/[notificationId]/resolve failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
