"use client";

import {JSX, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
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

const H_SPACING = 320;
const V_SPACING = 210;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 2;
const DEFAULT_COLLAPSE_DEPTH = 4;
const FOCUS_EXPAND_DEPTH = 2;

const isGateKind = (kind: FailureTreeNodePayload["kind"]) => kind === "gate_and" || kind === "gate_or";
const isGateNode = (node: RenderTreeNode) => isGateKind(node.payload.kind);

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

const buildRenderForest = (data: FailureTreeData | null): RenderTreeNode[] => {
    if (!data || data.nodes.length === 0) return [];

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

    return forest;
};

const layoutForest = (forest: RenderTreeNode[], collapsed: Set<string>): PositionedTreeResult | null => {
    if (forest.length === 0) return null;

    const positionedNodes: FailureTreeNodePayload[] = [];
    const positionedEdges: FailureTreeEdgePayload[] = [];
    const childMap = new Map<string, boolean>();
    let currentX = 0;

    const place = (treeNode: RenderTreeNode, depth: number): number => {
        const childXs: number[] = [];
        const hasChildren = treeNode.children.length > 0;
        const isCollapsed = collapsed.has(treeNode.renderId);

        if (hasChildren) {
            childMap.set(treeNode.renderId, true);
        }

        if (hasChildren && !isCollapsed) {
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
        }

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
        return {nodes: [], edges: [], childMap};
    }

    const minX = Math.min(...positionedNodes.map((node) => node.position.x));
    if (Number.isFinite(minX)) {
        positionedNodes.forEach((node) => {
            node.position = {x: node.position.x - minX + H_SPACING, y: node.position.y};
        });
    }

    return {nodes: positionedNodes, edges: positionedEdges, childMap};
};

const buildDefaultCollapsed = (forest: RenderTreeNode[]): Set<string> => {
    const collapsed = new Set<string>();

    const walk = (node: RenderTreeNode, depth: number) => {
        const nextDepth = depth + (isGateNode(node) ? 0 : 1);
        if (!isGateNode(node) && nextDepth >= DEFAULT_COLLAPSE_DEPTH && node.children.length > 0) {
            collapsed.add(node.renderId);
            return;
        }
        node.children.forEach((child) => walk(child.node, nextDepth));
    };

    forest.forEach((tree) => walk(tree, -1));
    return collapsed;
};

const normalizeKey = (value: string) => value.trim().toLowerCase();

const notificationFocusMap: Record<string, string> = {
    "critical flow drop": "Low Flow",
    "overtemperature risk": "Temperature Above Normal Conditions",
    "temperature drift detected": "Temperature Under Normal Conditions",
    "flow instability": "Flow out of normal conditions",
    "possible valve restriction": "Blockage in original route",
    "possible leak detected": "Leaks",
    "possible blockage detected": "Blockage in original route",
    "over-temperature pattern": "Temperature Above Normal Conditions",
    "pump failure signature": "Broken pump",
};

const resolveNotificationEventId = (data: FailureTreeData, title: string): string | null => {
    const mappedName = notificationFocusMap[normalizeKey(title)] ?? title;
    const target = normalizeKey(mappedName);
    const match = data.nodes.find((node) => normalizeKey(node.name) === target);
    return match?.id ?? null;
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

type FailureTreeViewState = {
    zoom: number;
    collapsed: string[];
    scrollLeft: number;
    scrollTop: number;
};

export const FailureTreePanel = ({
    focusTitle,
    viewState,
    onViewStateChange,
    onFocusHandled,
}: {
    focusTitle?: string | null;
    viewState?: FailureTreeViewState | null;
    onViewStateChange?: (next: FailureTreeViewState) => void;
    onFocusHandled?: () => void;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const anchorRef = useRef<{id: string; offsetX: number; offsetY: number} | null>(null);
    const pendingFocusTitleRef = useRef<string | null>(null);
    const focusRenderIdRef = useRef<string | null>(null);
    const [data, setData] = useState<FailureTreeData | null>(null);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [autoFit, setAutoFit] = useState(true);
    const [focusEventId, setFocusEventId] = useState<string | null>(null);
    const zoomRef = useRef(1);
    const restoredRef = useRef(false);
    const scrollRef = useRef({left: 0, top: 0});

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

    useEffect(() => {
        if (!focusTitle) return;
        if (!data) {
            pendingFocusTitleRef.current = focusTitle;
            return;
        }
        const eventId = resolveNotificationEventId(data, focusTitle);
        if (eventId) {
            setFocusEventId(eventId);
            onFocusHandled?.();
        }
    }, [focusTitle, data, onFocusHandled]);

    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);

    const zoomTo = useCallback((nextZoom: number, focal?: {x: number; y: number}) => {
        const viewport = viewportRef.current;
        if (!viewport) {
            setZoom(nextZoom);
            return;
        }

        const rect = viewport.getBoundingClientRect();
        const focusX = focal?.x ?? rect.left + rect.width / 2;
        const focusY = focal?.y ?? rect.top + rect.height / 2;
        const offsetX = focusX - rect.left;
        const offsetY = focusY - rect.top;
        const currentZoom = zoomRef.current || 1;
        if (Math.abs(nextZoom - currentZoom) < 0.001) return;

        const contentX = (viewport.scrollLeft + offsetX) / currentZoom;
        const contentY = (viewport.scrollTop + offsetY) / currentZoom;

        setZoom(nextZoom);
        requestAnimationFrame(() => {
            viewport.scrollLeft = contentX * nextZoom - offsetX;
            viewport.scrollTop = contentY * nextZoom - offsetY;
            scrollRef.current = {left: viewport.scrollLeft, top: viewport.scrollTop};
        });
    }, []);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const onWheel = (event: WheelEvent) => {
            if (!event.ctrlKey) return;
            event.preventDefault();
            setAutoFit(false);
            const zoomSpeed = 0.015;
            const factor = Math.exp(-event.deltaY * zoomSpeed);
            const nextZoom = Math.min(Math.max(zoomRef.current * factor, MIN_ZOOM), MAX_ZOOM);
            zoomTo(nextZoom, {x: event.clientX, y: event.clientY});
        };

        let raf = 0;
        const onScroll = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                scrollRef.current = {left: viewport.scrollLeft, top: viewport.scrollTop};
                if (onViewStateChange) {
                    onViewStateChange({
                        zoom: zoomRef.current,
                        collapsed: Array.from(collapsed),
                        scrollLeft: viewport.scrollLeft,
                        scrollTop: viewport.scrollTop,
                    });
                }
            });
        };

        viewport.addEventListener("wheel", onWheel, {passive: false});
        viewport.addEventListener("scroll", onScroll);
        return () => {
            viewport.removeEventListener("wheel", onWheel);
            viewport.removeEventListener("scroll", onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [collapsed, onViewStateChange, zoomTo]);

    const forest = useMemo(() => buildRenderForest(data), [data]);

    useEffect(() => {
        if (forest.length === 0) return;
        if (!restoredRef.current && !viewState) {
            const defaults = buildDefaultCollapsed(forest);
            setCollapsed(defaults);
            setAutoFit(true);
        }
    }, [forest, viewState]);

    useEffect(() => {
        if (!data) return;
        const pending = pendingFocusTitleRef.current;
        if (!pending) return;
        const eventId = resolveNotificationEventId(data, pending);
        pendingFocusTitleRef.current = null;
        if (eventId) {
            setFocusEventId(eventId);
            onFocusHandled?.();
        }
    }, [data, onFocusHandled]);
    const layoutResult = useMemo(() => layoutForest(forest, collapsed), [forest, collapsed]);

    const layoutBounds = useMemo(
        () => computeLayoutBounds(layoutResult?.nodes ?? []),
        [layoutResult],
    );

    useLayoutEffect(() => {
        if (restoredRef.current) return;
        if (!viewState) return;
        restoredRef.current = true;
        setCollapsed(new Set(viewState.collapsed));
        setAutoFit(true);
    }, [viewState]);

    const nodeDepthMap = useMemo(() => {
        const depths = new Map<string, number>();
        const walk = (node: RenderTreeNode, depth: number) => {
            const nextDepth = depth + (isGateNode(node) ? 0 : 1);
            depths.set(node.renderId, nextDepth);
            node.children.forEach((child) => walk(child.node, nextDepth));
        };
        forest.forEach((tree) => walk(tree, -1));
        return depths;
    }, [forest]);

    useLayoutEffect(() => {
        if (!autoFit) return;
        if (!layoutBounds || !viewportRef.current) return;
        const {width: viewW, height: viewH} = viewportRef.current.getBoundingClientRect();
        if (viewW === 0 || viewH === 0) return;
        const fitScale = Math.min(viewW / layoutBounds.width, viewH / layoutBounds.height, 1);
        zoomTo(Math.max(fitScale, MIN_ZOOM));
    }, [layoutBounds, autoFit, zoomTo]);

    useLayoutEffect(() => {
        if (!anchorRef.current) return;
        const viewport = viewportRef.current;
        if (!viewport) return;
        const anchor = anchorRef.current;
        const el = viewport.querySelector<HTMLElement>(`[data-node-id="${anchor.id}"]`);
        if (!el) return;
        const elRect = el.getBoundingClientRect();
        const viewRect = viewport.getBoundingClientRect();
        const currentLeft = elRect.left + elRect.width / 2 - viewRect.left;
        const currentTop = elRect.top + elRect.height / 2 - viewRect.top;

        const deltaX = currentLeft - anchor.offsetX;
        const deltaY = currentTop - anchor.offsetY;

        viewport.scrollLeft += deltaX;
        viewport.scrollTop += deltaY;
        anchorRef.current = null;
    }, [layoutResult]);

    useLayoutEffect(() => {
        if (!focusRenderIdRef.current) return;
        const viewport = viewportRef.current;
        if (!viewport) return;
        const el = viewport.querySelector<HTMLElement>(`[data-node-id="${focusRenderIdRef.current}"]`);
        if (!el) return;
        const elRect = el.getBoundingClientRect();
        const viewRect = viewport.getBoundingClientRect();
        const centerX = elRect.left + elRect.width / 2 - viewRect.left;
        const centerY = elRect.top + elRect.height / 2 - viewRect.top;
        viewport.scrollLeft += centerX - viewRect.width / 2;
        viewport.scrollTop += centerY - viewRect.height / 2;
        focusRenderIdRef.current = null;
    }, [layoutResult]);

    const edges: TreeEdge[] = useMemo(() => {
        if (!layoutResult) return [];
        return layoutResult.edges.map((edge) => ({from: edge.fromEventId, to: edge.toEventId}));
    }, [layoutResult]);

    useEffect(() => {
        if (!focusEventId || forest.length === 0) return;
        const collapsedSet = new Set<string>();
        let focusedRenderId: string | null = null;

        const markAllWithChildren = (node: RenderTreeNode) => {
            if (node.children.length > 0 && !isGateNode(node)) {
                collapsedSet.add(node.renderId);
            }
            node.children.forEach((child) => markAllWithChildren(child.node));
        };

        forest.forEach((tree) => markAllWithChildren(tree));

        const expandDown = (node: RenderTreeNode, depth: number) => {
            if (depth < 0 && !isGateNode(node)) return;
            collapsedSet.delete(node.renderId);
            const nextDepth = isGateNode(node) ? depth : depth - 1;
            node.children.forEach((child) => expandDown(child.node, nextDepth));
        };

        const walk = (node: RenderTreeNode, ancestors: RenderTreeNode[]): boolean => {
            let matched =
                (node.payload.sourceEventId ?? node.sourceId) === focusEventId ||
                node.payload.id === focusEventId;

            for (const child of node.children) {
                if (walk(child.node, [...ancestors, node])) {
                    matched = true;
                }
            }

            if (matched) {
                ancestors.forEach((ancestor) => collapsedSet.delete(ancestor.renderId));
                collapsedSet.delete(node.renderId);
                if (!focusedRenderId) {
                    focusedRenderId = node.renderId;
                    expandDown(node, FOCUS_EXPAND_DEPTH);
                }
            }
            return matched;
        };

        forest.forEach((tree) => {
            walk(tree, []);
        });

        setCollapsed(collapsedSet);
        setAutoFit(true);
        focusRenderIdRef.current = focusedRenderId;
        setFocusEventId(null);
    }, [focusEventId, forest]);

    useEffect(() => {
        if (!onViewStateChange) return;
        onViewStateChange({
            zoom,
            collapsed: Array.from(collapsed),
            scrollLeft: scrollRef.current.left,
            scrollTop: scrollRef.current.top,
        });
    }, [zoom, collapsed, onViewStateChange]);

    useEffect(() => {
        return () => {
            if (!onViewStateChange) return;
            onViewStateChange({
                zoom: zoomRef.current,
                collapsed: Array.from(collapsed),
                scrollLeft: scrollRef.current.left,
                scrollTop: scrollRef.current.top,
            });
        };
    }, [collapsed, onViewStateChange]);

    const toggleCollapse = useCallback((renderId: string) => {
        const viewport = viewportRef.current;
        if (viewport) {
            const el = viewport.querySelector<HTMLElement>(`[data-node-id="${renderId}"]`);
            if (el) {
                const elRect = el.getBoundingClientRect();
                const viewRect = viewport.getBoundingClientRect();
                anchorRef.current = {
                    id: renderId,
                    offsetX: elRect.left + elRect.width / 2 - viewRect.left,
                    offsetY: elRect.top + elRect.height / 2 - viewRect.top,
                };
            }
        }
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(renderId)) {
                next.delete(renderId);
            } else {
                next.add(renderId);
            }
            return next;
        });
    }, []);

    const handleExpandNextLevel = useCallback(() => {
        setCollapsed((prev) => {
            if (prev.size === 0) return prev;
            let minDepth = Infinity;
            prev.forEach((id) => {
                const depth = nodeDepthMap.get(id);
                if (depth !== undefined && depth < minDepth) {
                    minDepth = depth;
                }
            });
            if (!Number.isFinite(minDepth)) return prev;
            const next = new Set(prev);
            prev.forEach((id) => {
                if (nodeDepthMap.get(id) === minDepth) {
                    next.delete(id);
                }
            });
            return next;
        });
    }, [nodeDepthMap]);

    const handleCollapseNextLevel = useCallback(() => {
        setCollapsed((prev) => {
            if (!layoutResult) return prev;
            const {childMap} = layoutResult;
            const expandedWithChildren: string[] = [];
            layoutResult.nodes.forEach((node) => {
                if (isGateKind(node.kind)) return;
                if (!childMap.has(node.id)) return;
                if (prev.has(node.id)) return;
                expandedWithChildren.push(node.id);
            });
            if (expandedWithChildren.length === 0) return prev;
            let maxDepth = -Infinity;
            expandedWithChildren.forEach((id) => {
                const depth = nodeDepthMap.get(id);
                if (depth !== undefined && depth > maxDepth) {
                    maxDepth = depth;
                }
            });
            if (!Number.isFinite(maxDepth)) return prev;
            const next = new Set(prev);
            expandedWithChildren.forEach((id) => {
                if (nodeDepthMap.get(id) === maxDepth) {
                    next.add(id);
                }
            });
            return next;
        });
    }, [layoutResult, nodeDepthMap]);

    const handleZoomIn = useCallback(() => {
        setAutoFit(false);
        const nextZoom = Math.min(zoomRef.current + 0.1, MAX_ZOOM);
        zoomTo(nextZoom);
    }, []);

    const handleZoomOut = useCallback(() => {
        setAutoFit(false);
        const nextZoom = Math.max(zoomRef.current - 0.1, MIN_ZOOM);
        zoomTo(nextZoom);
    }, []);

    const handleZoomFit = useCallback(() => {
        if (!layoutBounds || !viewportRef.current) return;
        const {width: viewW, height: viewH} = viewportRef.current.getBoundingClientRect();
        if (viewW === 0 || viewH === 0) return;
        const fitScale = Math.min(viewW / layoutBounds.width, viewH / layoutBounds.height, 1);
        setAutoFit(true);
        zoomTo(Math.max(fitScale, MIN_ZOOM));
    }, [layoutBounds, zoomTo]);

    const nodes = useMemo(() => {
        if (!layoutResult) return [];
        const childMap = layoutResult.childMap;
        return layoutResult.nodes.map((node) => {
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
            const canCollapse = childMap.has(node.id);
            const isCollapsed = collapsed.has(node.id);

            return (
                <TreeNode key={node.id} id={node.id} className="absolute z-10" style={style}>
                    <div className="relative">
                        {content}
                        {canCollapse && node.kind !== "gate_and" && node.kind !== "gate_or" && (
                            <button
                                type="button"
                                aria-label={isCollapsed ? "Expand branch" : "Collapse branch"}
                                onClick={() => toggleCollapse(node.id)}
                                className="absolute left-1/2 top-full mt-2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border  bg-zinc-950/60 text-xs text-white/80 transition hover:border-white/40 hover:bg-sky-500/10"
                            >
                                {isCollapsed ? "+" : "−"}
                            </button>
                        )}
                    </div>
                </TreeNode>
            );
        });
    }, [layoutResult, collapsed, toggleCollapse]);


    return (
        <NodeRegistryProvider>
            <div className="relative w-full max-w-full min-w-0 min-h-0 flex flex-col gap-4 text-white/80">
                <div className="flex w-full items-start">
                    <div className="ml-auto flex items-center gap-2">
                        <div className="flex items-center gap-1 rounded-full border border-white/40 bg-zinc-950/50 px-2 py-1 text-xs text-white/70 shadow-sm shadow-sky-900/30">
                            <button
                                type="button"
                                aria-label="Collapse next level"
                                onClick={handleCollapseNextLevel}
                                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10 hover:text-white"
                            >
                                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                aria-label="Expand next level"
                                onClick={handleExpandNextLevel}
                                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10 hover:text-white"
                            >
                                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-white/40 bg-zinc-950/50 px-3 py-1 text-xs text-white/70 shadow-sm border-white/30">
                            <button type="button" onClick={handleZoomOut} className="rounded px-2 py-1 hover:bg-white/10 hover:text-white">−</button>
                            <span>{Math.round(zoom * 100)}%</span>
                            <button type="button" onClick={handleZoomIn} className="rounded px-2 py-1 hover:bg-white/10 hover:text-white">+</button>
                            <button type="button" onClick={handleZoomFit} className="rounded px-2 py-1 hover:bg-white/10 hover:text-white">Fit</button>
                        </div>
                    </div>
                </div>
                <div
                    ref={viewportRef}
                    className="relative h-[70vh] w-0 min-w-full max-w-full min-h-0 flex-none overflow-auto rounded-lg border border-white/10 bg-zinc-950/30 px-2 py-6"
                >
                    <div
                        className="relative inline-block"
                        style={
                            layoutBounds
                                ? {
                                    width: `${layoutBounds.width * zoom}px`,
                                    height: `${layoutBounds.height * zoom}px`,
                                }
                                : {minHeight: "320px"}
                        }
                    >
                        <div
                            ref={containerRef}
                            className="relative origin-top-left"
                            style={
                                layoutBounds
                                    ? {
                                        width: `${layoutBounds.width}px`,
                                        height: `${layoutBounds.height}px`,
                                        transform: `scale(${zoom})`,
                                    }
                                    : {minHeight: "320px"}
                            }
                        >
                            {layoutBounds && <ConnectorLayer containerRef={containerRef} edges={edges} zoom={zoom} />}
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
            </div>
        </NodeRegistryProvider>
    );
};
