import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { db } from "@/db/db";
import { partLinks, parts } from "@/db/schema";

async function main() {
    const partRows = await db.select().from(parts);
    const linkRows = await db.select().from(partLinks);

    const mapById = new Map(partRows.map((part) => [String(part.id), part]));
    const graph = new Map<string, { from: string[]; to: string[] }>();

    for (const link of linkRows) {
        const from = String(link.fromPartId);
        const to = String(link.toPartId);
        const entry = graph.get(from) ?? { from: [], to: [] };
        entry.to.push(to);
        graph.set(from, entry);

        const back = graph.get(to) ?? { from: [], to: [] };
        back.from.push(from);
        graph.set(to, back);
    }

    const result = partRows.map((part) => {
        const neighbors = graph.get(String(part.id)) ?? { from: [], to: [] };
        const from = neighbors.from.map((neighborId) => {
            const neighbor = mapById.get(neighborId);
            return neighbor
                ? {
                      partId: neighbor.id,
                      elementId: neighbor.elementId,
                      type: neighbor.type,
                      name: neighbor.name,
                  }
                : { partId: neighborId };
        });
        const to = neighbors.to.map((neighborId) => {
            const neighbor = mapById.get(neighborId);
            return neighbor
                ? {
                      partId: neighbor.id,
                      elementId: neighbor.elementId,
                      type: neighbor.type,
                      name: neighbor.name,
                  }
                : { partId: neighborId };
        });

        return {
            id: part.id,
            elementId: part.elementId,
            name: part.name,
            type: part.type,
            description: part.description,
            connections: {
                from,
                to,
            },
        };
    });

    const filePath = resolve(process.cwd(), "src", "data", "pump-plan-store.json");
    writeFileSync(filePath, JSON.stringify(result, null, 2));
    console.log(`Wrote ${result.length} parts to ${filePath}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
