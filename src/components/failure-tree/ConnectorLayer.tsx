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

export const ConnectorLayer = ({
    containerRef,
    edges,
    zoom = 1,
}: {
    containerRef: RefObject<HTMLDivElement>;
    edges: TreeEdge[];
    zoom?: number;
}) => {
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

    useEffect(() => {
        setTick((t) => t + 1);
    }, [zoom]);

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

            const x1 = (start.x - bounds.left) / zoom;
            const y1 = (start.y - bounds.top) / zoom;
            const x2 = (end.x - bounds.left) / zoom;
            const y2 = (end.y - bounds.top) / zoom;

            if (Math.abs(x2 - x1) < 1) {
                const dStraight = `M ${x1} ${y1} L ${x1} ${y2}`;
                return [{key: `${from}->${to}`, d: dStraight}];
            }

            const midY = (y1 + y2) / 2;
            const horizontalDir = x2 >= x1 ? 1 : -1;
            const verticalDir = y2 >= y1 ? 1 : -1;
            const radius = Math.min(24, Math.abs(midY - y1), Math.abs(x2 - x1) / 2);
            const elbowY1 = midY - verticalDir * radius;
            const elbowY2 = midY + verticalDir * radius;
            const elbowX1 = x1 + horizontalDir * radius;
            const elbowX2 = x2 - horizontalDir * radius;

            const segments = [
                `M ${x1} ${y1}`,
                `L ${x1} ${elbowY1}`,
                `Q ${x1} ${midY} ${elbowX1} ${midY}`,
                `L ${elbowX2} ${midY}`,
                `Q ${x2} ${midY} ${x2} ${elbowY2}`,
                `L ${x2} ${y2}`,
            ];

            return [{key: `${from}->${to}`, d: segments.join(" ")}];
        });
    }, [edges, nodes, containerRef, tick]);

    return (
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {paths.map((path) => (
                <path
                    key={path.key}
                    d={path.d}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
            ))}
        </svg>
    );
};
