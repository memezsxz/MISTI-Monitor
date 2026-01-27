"use client";

import {useEffect, useMemo, useRef, useState} from "react";
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

export const FailureTreePanel = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<FailureTreeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const layout = useMemo(() => computeLayout(data?.nodes ?? []), [data]);

    const edges: TreeEdge[] = useMemo(() => {
        if (!data) return [];
        return data.edges.map((edge) => ({
            from: edge.fromEventId,
            to: edge.toEventId,
        }));
    }, [data]);

    const nodes = useMemo(() => {
        if (!data || !layout) return [];
        return data.nodes.map((node) => {
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
    }, [data, layout]);

    return (
        <Container>
            <NodeRegistryProvider>
                <div className="relative flex w-full flex-col gap-4 text-white/80">
                    <div className="text-sm text-white/60">
                        Failure tree loaded from the database seed with automatic layout and connector overlay.
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
