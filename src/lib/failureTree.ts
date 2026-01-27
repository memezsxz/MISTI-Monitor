import {db} from "@/db/db";
import {failureEventLinks, failureEvents} from "@/db/schema/failure_events";
import type {FailureEventLinkRow, FailureEventRow} from "@/db/schema/failure_events";
import {
    FailureTreeData,
    FailureTreeEdgePayload,
    FailureTreeNodePayload,
} from "@/types/failureTree";

const LEVEL_SPACING = 200;
const NODE_SPACING = 240;

interface PositionedFailureNode extends FailureEventRow {
    position: {x: number; y: number};
}

export async function getFailureFlowData(): Promise<FailureTreeData> {
    const [nodes, edges] = await Promise.all([
        db.select().from(failureEvents),
        db.select().from(failureEventLinks),
    ]);

    const positionedNodes = layoutNodes(nodes, edges);

    return {
        nodes: positionedNodes.map(serializeNode),
        edges: edges.map(serializeEdge),
    };
}

function layoutNodes(nodes: FailureEventRow[], edges: FailureEventLinkRow[]): PositionedFailureNode[] {
    if (nodes.length === 0) return [];

    const incomingCount = new Map<string, number>();
    const childrenMap = new Map<string, string[]>();
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));

    nodes.forEach((node) => {
        incomingCount.set(node.id, 0);
        childrenMap.set(node.id, []);
    });

    edges.forEach((edge) => {
        if (!incomingCount.has(edge.toEventId)) return;
        incomingCount.set(edge.toEventId, (incomingCount.get(edge.toEventId) ?? 0) + 1);
        childrenMap.get(edge.fromEventId)?.push(edge.toEventId);
    });

    const levelMap = new Map<string, number>();
    const queue: string[] = [];

    for (const node of nodes) {
        if ((incomingCount.get(node.id) ?? 0) === 0) {
            levelMap.set(node.id, 0);
            queue.push(node.id);
        }
    }

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentLevel = levelMap.get(currentId) ?? 0;
        const children = childrenMap.get(currentId) ?? [];

        for (const childId of children) {
            const nextLevel = currentLevel + 1;
            const existingLevel = levelMap.get(childId);
            if (existingLevel === undefined || nextLevel > existingLevel) {
                levelMap.set(childId, nextLevel);
            }
            const updatedIncoming = (incomingCount.get(childId) ?? 0) - 1;
            incomingCount.set(childId, updatedIncoming);
            if (updatedIncoming === 0) {
                queue.push(childId);
            }
        }
    }

    // Any nodes not reached (e.g., cycles or isolated) default to level 0
    nodes.forEach((node) => {
        if (!levelMap.has(node.id)) {
            levelMap.set(node.id, 0);
        }
    });

    const levels = new Map<number, FailureEventRow[]>();
    for (const node of nodes) {
        const level = levelMap.get(node.id) ?? 0;
        const list = levels.get(level) ?? [];
        list.push(node);
        levels.set(level, list);
    }

    const positioned: PositionedFailureNode[] = [];

    const sortedLevels = Array.from(levels.entries()).sort(([a], [b]) => a - b);

    for (const [level, list] of sortedLevels) {
        list.sort((a, b) => a.name.localeCompare(b.name));
        const totalWidth = (list.length - 1) * NODE_SPACING;
        list.forEach((node, index) => {
            const x = index * NODE_SPACING - totalWidth / 2;
            const y = level * LEVEL_SPACING;
            positioned.push({
                ...node,
                position: {x, y},
            });
        });
    }

    return positioned;
}

function serializeNode(node: PositionedFailureNode): FailureTreeNodePayload {
    return {
        id: node.id,
        name: node.name,
        kind: node.kind,
        description: node.description ?? null,
        probability: node.probability ?? null,
        severity: node.severity ?? null,
        detection: node.detection ?? null,
        metadata: parseRecord(node.metadata),
        tags: parseStringArray(node.tags),
        position: node.position,
    };
}

function serializeEdge(edge: FailureEventLinkRow): FailureTreeEdgePayload {
    return {
        id: edge.id,
        fromEventId: edge.fromEventId,
        toEventId: edge.toEventId,
        linkType: edge.linkType ?? null,
        metadata: parseRecord(edge.metadata),
    };
}

function parseRecord(value: string | null): Record<string, string | number> | null {
    if (!value) return null;
    try {
        const parsed = JSON.parse(value) as unknown;
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
            return null;
        }
        const entries = Object.entries(parsed).reduce<Record<string, string | number>>((acc, [key, val]) => {
            if (typeof val === "string" || typeof val === "number") {
                acc[key] = val;
            }
            return acc;
        }, {});
        return Object.keys(entries).length > 0 ? entries : null;
    } catch {
        return null;
    }
}

function parseStringArray(value: string | null): string[] | null {
    if (!value) return null;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map((entry) => String(entry)) : null;
    } catch {
        return null;
    }
}
