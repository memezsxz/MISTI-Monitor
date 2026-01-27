import {RefObject, useEffect, useLayoutEffect, useMemo, useState} from "react";
import {useNodeRegistry} from "@/components/failure-tree/NodeRegistry";

export interface TreeEdge {
    from: string;
    to: string;
}

const anchor = (el: HTMLElement, position: "top" | "bottom") => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = position === "top" ? rect.top : rect.bottom;
    return {x, y};
};

export const ConnectorLayer = ({containerRef, edges}: {containerRef: RefObject<HTMLDivElement>; edges: TreeEdge[]}) => {
    const {nodes, subscribe} = useNodeRegistry();
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const unsubscribe = subscribe(() => setTick((t) => t + 1));
        return () => unsubscribe();
    }, [subscribe]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => setTick((t) => t + 1));
        resizeObserver.observe(container);

        const onViewportChange = () => setTick((t) => t + 1);
        window.addEventListener("resize", onViewportChange);
        window.addEventListener("scroll", onViewportChange, true);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", onViewportChange);
            window.removeEventListener("scroll", onViewportChange, true);
        };
    }, [containerRef]);

    const paths = useMemo(() => {
        const container = containerRef.current;
        if (!container) return [];
        const bounds = container.getBoundingClientRect();

        return edges.flatMap(({from, to}) => {
            const fromEl = nodes.get(from);
            const toEl = nodes.get(to);
            if (!fromEl || !toEl) return [];

            const start = anchor(fromEl, "bottom");
            const end = anchor(toEl, "top");

            const x1 = start.x - bounds.left;
            const y1 = start.y - bounds.top;
            const x2 = end.x - bounds.left;
            const y2 = end.y - bounds.top;

            const deltaY = Math.max(40, Math.abs(y2 - y1) * 0.4);
            const d = `M ${x1} ${y1} C ${x1} ${y1 + deltaY} ${x2} ${y2 - deltaY} ${x2} ${y2}`;
            return [{key: `${from}->${to}`, d}];
        });
    }, [edges, nodes, containerRef, tick]);

    return (
        <svg className="pointer-events-none absolute inset-0 h-full w-full text-white/40">
            {paths.map((path) => (
                <path key={path.key} d={path.d} fill="none" stroke="currentColor" strokeWidth={2} />
            ))}
        </svg>
    );
};
