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

const EVENT_COMPONENTS: Record<FailureEventVariant, (props: {event: FailureEvent}) => JSX.Element> = {
    basic: ({event}) => <BasicEventCard event={event} />,
    failureMode: ({event}) => <FailureModeCard event={event} />,
    intermediate: ({event}) => <IntermediateEventCard event={event} />,
    top: ({event}) => <TopEventCard event={event} highlight />,
};

const H_SPACING = 220;
const V_SPACING = 170;

type ViewMode = "tree" | "graph";

const mapNodeToEvent = (node: FailureTreeNodePayload, variant: FailureEventVariant): FailureEvent => {
    const probability = node.probability ?? undefined;
    const severity = node.severity ?? undefined;
    const detection = node.detection ?? undefined;
    const hasMetrics = probability !== undefined || severity !== undefined || detection !== undefined;
    return {
        id: node.sourceEventId ?? node.id,
        name: node.name,
        kind: variant,
        description: node.description ?? undefined,
        metrics: hasMetrics ? {probability, severity, detection} : undefined,
        metadata: node.metadata ?? undefined,
        tags: node.tags ?? undefined,
    };
};

interface RenderTreeNode {
    renderId: string;
    sourceId: string;
    payload: FailureTreeNodePayload;
    children: RenderTreeChild[];
}

interface RenderTreeChild {
    edge: FailureTreeEdgePayload;
    node: RenderTreeNode;
}

const buildDuplicatedTreeLayout = (data: FailureTreeData | null): FailureTreeData | null => {
    if (!data || data.nodes.length === 0) return data;

    const nodeMap = new Map(data.nodes.map((node) => [node.id, node]));
    const adjacency = new Map<string, FailureTreeEdgePayload[]>();
    const incoming = new Map<string, number>();

    data.nodes.forEach((node) => {
        adjacency.set(node.id, []);
        incoming.set(node.id, 0);
    });

    data.edges.forEach((edge) => {
        const bucket = adjacency.get(edge.fromEventId);
        if (bucket) {
            bucket.push(edge);
        } else {
            adjacency.set(edge.fromEventId, [edge]);
        }
        incoming.set(edge.toEventId, (incoming.get(edge.toEventId) ?? 0) + 1);
    });

    const roots = data.nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
    const orderedRoots = (roots.length > 0 ? roots : data.nodes).sort((a, b) => a.name.localeCompare(b.name));

    let cloneCounter = 0;
    const forest: RenderTreeNode[] = [];

    const buildNode = (eventId: string, ancestors: Set<string>): RenderTreeNode | null => {
        const base = nodeMap.get(eventId);
        if (!base) return null;
        const renderId = `${eventId}__tree_${cloneCounter++}`;
        const payload: FailureTreeNodePayload = {
            ...base,
            id: renderId,
            sourceEventId: base.sourceEventId ?? base.id,
            position: {x: 0, y: 0},
        };
        const nextAncestors = new Set(ancestors);
        nextAncestors.add(eventId);
        const children = (adjacency.get(eventId) ?? [])
            .map((edge) => {
                if (nextAncestors.has(edge.toEventId)) {
                    return null;
                }
                const child = buildNode(edge.toEventId, nextAncestors);
                return child ? {edge, node: child} : null;
            })
            .filter(Boolean) as RenderTreeChild[];
        return {
            renderId,
            sourceId: base.id,
            payload,
            children,
        };
    };

    orderedRoots.forEach((root) => {
        const tree = buildNode(root.id, new Set());
        if (tree) {
            forest.push(tree);
        }
    });

    const positionedNodes: FailureTreeNodePayload[] = [];
    const positionedEdges: FailureTreeEdgePayload[] = [];
    let currentX = 0;

    const place = (treeNode: RenderTreeNode, depth: number): number => {
        const childXs: number[] = [];
        treeNode.children.forEach((child) => {
            const childX = place(child.node, depth + 1);
            childXs.push(childX);
            positionedEdges.push({
                id: `${treeNode.renderId}->${child.node.renderId}`,
                fromEventId: treeNode.renderId,
                toEventId: child.node.renderId,
                linkType: child.edge.linkType,
                metadata: child.edge.metadata,
            });
        });

        let x: number;
        if (childXs.length === 0) {
            x = currentX;
            currentX += H_SPACING;
        } else {
            const min = Math.min(...childXs);
            const max = Math.max(...childXs);
            x = min + (max - min) / 2;
        }

        positionedNodes.push({
            ...treeNode.payload,
            position: {x, y: depth * V_SPACING},
        });

        return x;
    };

    forest.forEach((tree) => {
        place(tree, 0);
        currentX += H_SPACING;
    });

    if (positionedNodes.length === 0) {
        return {nodes: [], edges: []};
    }

    const minX = Math.min(...positionedNodes.map((node) => node.position.x));
    if (Number.isFinite(minX)) {
        positionedNodes.forEach((node) => {
            node.position = {x: node.position.x - minX + H_SPACING, y: node.position.y};
        });
    }

    return {nodes: positionedNodes, edges: positionedEdges};
};

const computeLayoutBounds = (nodes: FailureTreeNodePayload[]): {width: number; height: number} | null => {
    if (nodes.length === 0) return null;
    const xs = nodes.map((node) => node.position.x);
    const ys = nodes.map((node) => node.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
        width: Math.max(320, maxX - minX + H_SPACING * 2),
        height: Math.max(320, maxY - minY + V_SPACING * 2),
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
                if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
                const payload = (await res.json()) as FailureTreeData;
                if (!active) return;
                setData(payload);
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : "Failed to load failure tree");
                setData(null);
            } finally {
                if (active) setLoading(false);
            }
        };
        void load();
        return () => {
            active = false;
        };
    }, []);

    const renderData = useMemo(() => {
        if (!data) return null;
        return viewMode === "tree" ? buildDuplicatedTreeLayout(data) : data;
    }, [data, viewMode]);

    const layoutBounds = useMemo(() => computeLayoutBounds(renderData?.nodes ?? []), [renderData]);

    const edges: TreeEdge[] = useMemo(() => {
        if (!renderData) return [];
        return renderData.edges.map((edge) => ({from: edge.fromEventId, to: edge.toEventId}));
    }, [renderData]);

    const nodes = useMemo(() => {
        if (!renderData) return [];
        return renderData.nodes.map((node) => {
            const variant = NON_GATE_VARIANTS[node.kind];
            const gateType = node.kind === "gate_and" ? "and" : node.kind === "gate_or" ? "or" : null;
            const style = {
                position: "absolute" as const,
                left: node.position.x,
                top: node.position.y,
                transform: "translate(-50%, 0)",
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
    }, [renderData]);

    const description =
        viewMode === "tree"
            ? "Tree view duplicates intermediate branches per parent, so every child sits directly beneath its parent with no crossed lines."
            : "Graph view renders each event once (shared leaves included), which can create crossing lines but preserves the raw DAG.";

    return (
        <Container>
            <NodeRegistryProvider>
                <div className="relative flex w-full flex-col gap-4 text-white/80">
                    <div className="flex flex-col gap-2 text-sm text-white/60 lg:flex-row lg:items-center lg:justify-between">
                        <p>{description}</p>
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
                                layoutBounds
                                    ? {width: `${layoutBounds.width}px`, height: `${layoutBounds.height}px`}
                                    : {minHeight: "320px"}
                            }
                        >
                            {layoutBounds && <ConnectorLayer containerRef={containerRef} edges={edges} />}
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
