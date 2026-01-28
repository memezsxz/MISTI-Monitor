import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { db } from "@/db/db";
import { failureEventLinks, failureEvents } from "@/db/schema/failure_events";

async function main() {
    const [nodes, links] = await Promise.all([
        db.select().from(failureEvents),
        db.select().from(failureEventLinks),
    ]);

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const childrenById = new Map<string, string[]>();

    links.forEach((link) => {
        const bucket = childrenById.get(link.fromEventId) ?? [];
        bucket.push(link.toEventId);
        childrenById.set(link.fromEventId, bucket);
    });

    const result = nodes.map((node) => {
        const children = (childrenById.get(node.id) ?? [])
            .map((childId) => nodeById.get(childId))
            .filter(Boolean)
            .map((child) => ({
                id: child!.id,
                name: child!.name,
                kind: child!.kind,
            }));

        return {
            id: node.id,
            name: node.name,
            kind: node.kind,
            description: node.description,
            severity: node.severity,
            detection: node.detection,
            probability: node.probability,
            metadata: node.metadata,
            tags: node.tags,
            children,
        };
    });

    const filePath = resolve(process.cwd(), "src", "data", "failure-tree-store.json");
    writeFileSync(filePath, JSON.stringify(result, null, 2));
    console.log(`Wrote ${result.length} failure events to ${filePath}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
