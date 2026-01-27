"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import clsx from "clsx";
import {Container} from "@/components/Container";
import {
    BasicEventCard,
    FailureEventVariant,
    FailureModeCard,
    IntermediateEventCard,
    TopEventCard,
} from "@/components/failure-tree/EventCard";
import {AndGate, OrGate} from "@/components/failure-tree/Gates";
import {ConnectorLayer, TreeEdge} from "@/components/failure-tree/ConnectorLayer";
import {NodeRegistryProvider} from "@/components/failure-tree/NodeRegistry";
import {TreeNode} from "@/components/failure-tree/TreeNode";
import {
    FailureEvent,
    FailureTreeData,
    FailureTreeEdgePayload,
    FailureTreeNodePayload,
} from "@/types/failureTree";

const DATA_URL = "/api/failure-tree";
const NON_GATE_VARIANTS: Partial<Record<FailureTreeNodePayload["kind"], FailureEventVariant>> = {
    basic: "basic",
    intermediate: "intermediate",
    top: "top",
    failure_mode: "failureMode",
};

interface LayoutMetrics {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
}

const EVENT_COMPONENTS: Record<FailureEventVariant, (props: {event: FailureEvent}) => JSX.Element> = {
    basic: ({event}) => <BasicEventCard event={event} />,
    failureMode: ({event}) => <FailureModeCard event={event} />,
    intermediate: ({event}) => <IntermediateEventCard event={event} />,
    top: ({event}) => <TopEventCard event={event} highlight />,
};

const computeLayout = (nodes: FailureTreeNodePayload[]): LayoutMetrics | null => {
    if (nodes.length === 0) return null;
    const xs = nodes.map((node) => node.position.x);
    const ys = nodes.map((node) => node.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const paddingX = 160;
    const paddingY = 140;
    const width = Math.max(maxX - minX, 0) + paddingX * 2;
    const height = Math.max(maxY - minY, 0) + paddingY * 2;

    return {
        width,
        height: Math.max(height, 320),
        offsetX: paddingX - minX,
        offsetY: paddingY - minY,
    };
};

const mapNodeToEvent = (node: FailureTreeNodePayload, variant: FailureEventVariant): FailureEvent => {
    const probability = node.probability ?? undefined;
    const severity = node.severity ?? undefined;
    const detection = node.detection ?? undefined;
    const hasMetrics = probability !== undefined || severity !== undefined || detection !== undefined;
    return {
        id: node.id,
        name: node.name,
        kind: variant,
        description: node.description ?? undefined,
        metrics: hasMetrics ? {probability, severity, detection} : undefined,
        metadata: node.metadata ?? undefined,
        tags: node.tags ?? undefined,
    };
};

const TREE_NODE_SPACING = 240;
const TREE_LEVEL_SPACING = 200;
type ViewMode = "tree" | "graph";

interface CloneQueueEntry {
    originalId: string;
    parentRenderId: string | null;
    incomingEdge?: FailureTreeEdgePayload;
}

const applyTreeLayout = (
    nodes: FailureTreeNodePayload[],
    edges: FailureTreeEdgePayload[],
): FailureTreeNodePayload[] => {
    if (nodes.length === 0) return nodes;x

    const incomingCount = new Map<string, number>();
    const childrenMap = new Map<string, string[]>();

    nodes.forEach((node) => {
        incomingCount.set(node.id, 0);
        childrenMap.set(node.id, []);
    });

    edges.forEach((edge) => {
        if (!incomingCount.has(edge.toEventId)) {
            incomingCount.set(edge.toEventId, 0);
        }
        incomingCount.set(edge.toEventId, (incomingCount.get(edge.toEventId) ?? 0) + 1);
        const list = childrenMap.get(edge.fromEventId);
        if (list) {
            list.push(edge.toEventId);
        }
    });

    const levelMap = new Map<string, number>();
    const queue: string[] = [];

    nodes.forEach((node) => {
        if ((incomingCount.get(node.id) ?? 0) === 0) {
            queue.push(node.id);
            levelMap.set(node.id, 0);
        }
    });

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentLevel = levelMap.get(currentId) ?? 0;
        const children = childrenMap.get(currentId) ?? [];

        for (const childId of children) {
            const nextLevel = currentLevel + 1;
            if (!levelMap.has(childId) || (levelMap.get(childId) ?? 0) < nextLevel) {
                levelMap.set(childId, nextLevel);
            }
            const updatedIncoming = (incomingCount.get(childId) ?? 0) - 1;
            incomingCount.set(childId, updatedIncoming);
            if (updatedIncoming === 0) {
                queue.push(childId);
            }
        }
    }

    nodes.forEach((node) => {
        if (!levelMap.has(node.id)) {
            levelMap.set(node.id, 0);
        }
    });

    const levels = new Map<number, FailureTreeNodePayload[]>();
    nodes.forEach((node) => {
        const level = levelMap.get(node.id) ?? 0;
        const bucket = levels.get(level);
        if (bucket) {
            bucket.push(node);
        } else {
            levels.set(level, [node]);
        }
    });

    const result: FailureTreeNodePayload[] = [];
    const sortedLevels = Array.from(levels.entries()).sort(([a], [b]) => a - b);

    for (const [level, list] of sortedLevels) {
        list.sort((a, b) => a.name.localeCompare(b.name));
        const totalWidth = (list.length - 1) * TREE_NODE_SPACING;
        list.forEach((node, index) => {
            result.push({
                ...node,
                position: {
                    x: index * TREE_NODE_SPACING - totalWidth / 2,
                    y: level * TREE_LEVEL_SPACING,
                },
            });
        });
    }

    return result;
};

const buildTreeViewData = (data: FailureTreeData | null): FailureTreeData | null => {
    if (!data || data.nodes.length === 0) return data;

    const nodeMap = new Map(data.nodes.map((node) => [node.id, node]));
    const parentCount = new Map<string, number>();
    const childrenMap = new Map<string, FailureTreeEdgePayload[]>();

    data.nodes.forEach((node) => {
        parentCount.set(node.id, 0);
        childrenMap.set(node.id, []);
    });

    data.edges.forEach((edge) => {
        parentCount.set(edge.toEventId, (parentCount.get(edge.toEventId) ?? 0) + 1);
        const list = childrenMap.get(edge.fromEventId);
        if (list) {
            list.push(edge);
        } else {
            childrenMap.set(edge.fromEventId, [edge]);
        }
    });

    let roots = data.nodes.filter((node) => (parentCount.get(node.id) ?? 0) === 0);
    if (roots.length === 0) {
        roots = [...data.nodes];
    }
    roots.sort((a, b) => a.name.localeCompare(b.name));

    const queue: CloneQueueEntry[] = roots.map((root) => ({
        originalId: root.id,
        parentRenderId: null,
    }));

    const renderNodes: FailureTreeNodePayload[] = [];
    const renderEdges: FailureTreeEdgePayload[] = [];
    const renderedIds = new Set<string>();
    const canonicalIdMap = new Map<string, string>();
    const cloneCounter = new Map<string, number>();
    const edgeCloneCounter = new Map<string, number>();
    const touchedOriginals = new Set<string>();
    let syntheticEdgeCounter = 0;

    const ensureNodeClone = (renderId: string, original: FailureTreeNodePayload) => {
        touchedOriginals.add(original.id);
        if (renderedIds.has(renderId)) return;
        renderNodes.push({
            ...original,
            id: renderId,
            position: {x: 0, y: 0},
        });
        renderedIds.add(renderId);
    };

    const makeDuplicateId = (originalId: string) => {
        const count = (cloneCounter.get(originalId) ?? 0) + 1;
        cloneCounter.set(originalId, count);
        return `${originalId}__dup_${count}`;
    };

    const createEdgeId = (edge?: FailureTreeEdgePayload) => {
        if (!edge) {
            syntheticEdgeCounter += 1;
            return `synthetic_edge_${syntheticEdgeCounter}`;
        }
        const count = (edgeCloneCounter.get(edge.id) ?? 0) + 1;
        edgeCloneCounter.set(edge.id, count);
        return count === 1 ? edge.id : `${edge.id}__dup_${count}`;
    };

    while (queue.length > 0) {
        const entry = queue.shift()!;
        const baseNode = nodeMap.get(entry.originalId);
        if (!baseNode) {
            continue;
        }

        const parents = parentCount.get(entry.originalId) ?? 0;
        const needsDuplication = parents > 1 && entry.parentRenderId !== null;

        let renderId: string;
        if (needsDuplication) {
            renderId = makeDuplicateId(entry.originalId);
            ensureNodeClone(renderId, baseNode);
        } else {
            const existing = canonicalIdMap.get(entry.originalId);
            if (existing) {
                renderId = existing;
                ensureNodeClone(renderId, baseNode);
            } else {
                renderId = entry.originalId;
                canonicalIdMap.set(entry.originalId, renderId);
                ensureNodeClone(renderId, baseNode);
            }
        }

        if (entry.parentRenderId && entry.incomingEdge) {
            renderEdges.push({
                id: createEdgeId(entry.incomingEdge),
                fromEventId: entry.parentRenderId,
                toEventId: renderId,
                linkType: entry.incomingEdge.linkType ?? null,
                metadata: entry.incomingEdge.metadata ?? null,
            });
        }

        const childEdges = childrenMap.get(entry.originalId) ?? [];
        childEdges.forEach((childEdge) => {
            queue.push({
                originalId: childEdge.toEventId,
                parentRenderId: renderId,
                incomingEdge: childEdge,
            });
        });
    }

    data.nodes.forEach((node) => {
        if (!touchedOriginals.has(node.id)) {
            ensureNodeClone(node.id, node);
        }
    });

    const laidOutNodes = applyTreeLayout(renderNodes, renderEdges);

    return {
        nodes: laidOutNodes,
        edges: renderEdges,
    };
};

export const FailureTreePanel = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<FailureTreeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("tree");

    useEffect(() => {
        let active = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(DATA_URL, {method: "GET", cache: "no-store"});
                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }
                const payload = (await res.json()) as FailureTreeData;
                if (!active) return;
                setData(payload);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : "Failed to load failure tree");
                setData(null);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    const viewData = useMemo(() => {
        if (!data) return null;
        return viewMode === "tree" ? buildTreeViewData(data) : data;
    }, [data, viewMode]);

    const layout = useMemo(() => computeLayout(viewData?.nodes ?? []), [viewData]);

    const edges: TreeEdge[] = useMemo(() => {
        if (!viewData) return [];
        return viewData.edges.map((edge) => ({
            from: edge.fromEventId,
            to: edge.toEventId,
        }));
    }, [viewData]);

    const nodes = useMemo(() => {
        if (!viewData || !layout) return [];
        return viewData.nodes.map((node) => {
            const variant = NON_GATE_VARIANTS[node.kind];
            const gateType = node.kind === "gate_and" ? "and" : node.kind === "gate_or" ? "or" : null;
            const style = {
                position: "absolute" as const,
                left: layout.offsetX + node.position.x,
                top: layout.offsetY + node.position.y,
                transform: "translateX(-50%)",
            };

            let content: JSX.Element | null = null;
            if (gateType === "and") {
                content = <AndGate />;
            } else if (gateType === "or") {
                content = <OrGate />;
            } else if (variant) {
                const event = mapNodeToEvent(node, variant);
                const Component = EVENT_COMPONENTS[variant];
                content = <Component event={event} />;
            }

            return (
                <TreeNode key={node.id} id={node.id} className="absolute z-10" style={style}>
                    {content}
                </TreeNode>
            );
        });
    }, [viewData, layout]);

    const viewDescription =
        viewMode === "tree"
            ? "Tree view duplicates shared events for each branch to eliminate connector crossovers."
            : "Graph view shows each event once, preserving shared connections even if lines overlap.";

    return (
        <Container>
            <NodeRegistryProvider>
                <div className="relative flex w-full flex-col gap-4 text-white/80">
                    <div className="flex flex-col gap-2 text-sm text-white/60 lg:flex-row lg:items-center lg:justify-between">
                        <p>{viewDescription}</p>
                        <div className="flex gap-2 text-xs">
                            {([
                                {mode: "tree" as ViewMode, label: "Tree View"},
                                {mode: "graph" as ViewMode, label: "Graph View"},
                            ]).map((option) => (
                                <button
                                    key={option.mode}
                                    type="button"
                                    onClick={() => setViewMode(option.mode)}
                                    className={clsx(
                                        "rounded-full border px-3 py-1 transition-colors",
                                        viewMode === option.mode
                                            ? "border-white/70 bg-white/10 text-white"
                                            : "border-white/20 text-white/60 hover:border-white/40 hover:text-white",
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative w-full overflow-auto rounded-lg border border-white/10 bg-zinc-950/40 px-2 py-6">
                        <div
                            ref={containerRef}
                            className="relative mx-auto"
                            style={
                                layout
                                    ? {width: `${layout.width}px`, height: `${layout.height}px`}
                                    : {minHeight: "320px"}
                            }
                        >
                            {layout && <ConnectorLayer containerRef={containerRef} edges={edges} />}
                            {nodes}
                            {loading && (
                                <div className="absolute left-4 top-4 rounded-md bg-zinc-900/80 px-3 py-2 text-xs text-white/70">
                                    Loading tree…
                                </div>
                            )}
                            {error && !loading && (
                                <div className="absolute left-4 top-4 rounded-md bg-red-900/80 px-3 py-2 text-xs text-white/90">
                                    {error}
                                </div>
                            )}
                            {!loading && !error && nodes.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
                                    No failure tree data available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </NodeRegistryProvider>
        </Container>
    );
};
