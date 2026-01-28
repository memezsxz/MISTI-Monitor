import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { turnoverNotes } from "@/db/schema/turnover_notes";
import { formatLocalDateTime } from "@/lib/localDate";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string) {
    const n = Number(raw.trim());
    return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
    try {
        const { id: rawId } = await ctx.params;
        const id = parseId(rawId);

        if (!id) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        const body = (await req.json()) as { text?: string };
        const text = (body.text ?? "").trim();

        if (!text) {
            return NextResponse.json({ error: "text is required" }, { status: 400 });
        }

        const updated = await db
            .update(turnoverNotes)
            .set({ text, updatedAt: formatLocalDateTime() })
            .where(eq(turnoverNotes.id, id))
            .returning();

        return NextResponse.json(updated[0] ?? null);
    } catch (err) {
        console.error("PATCH /api/notes/[id] failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(_: Request, ctx: Ctx) {
    try {
        const { id: rawId } = await ctx.params;
        const id = parseId(rawId);

        if (!id) {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        await db.delete(turnoverNotes).where(eq(turnoverNotes.id, id));
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("DELETE /api/notes/[id] failed:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
