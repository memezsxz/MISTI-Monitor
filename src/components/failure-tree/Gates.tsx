import clsx from "clsx";
import {GateType} from "@/types/failureTree";

const gateStyleMap: Record<GateType, { text: string; label: string; }> = {
    and: {
        text: "text-sky-300",
        label: "AND",
    },
    or: {
        text: "text-rose-300",
        label: "OR",
    },
};

const gatePaths: Record<GateType, string> = {
    and: "M18 8 H52 Q82 8 82 40 Q82 72 52 72 H18 Z",
    or: "M18 8 Q40 40 18 72 Q34 72 68 72 Q92 40 68 8 Q34 8 18 8 Z",
};

const gateLineMap: Record<GateType, { top: { x1: number; y1: number; x2: number; y2: number }; bottom: { x1: number; y1: number; x2: number; y2: number } }> = {
    and: {
        top: { x1: 50, y1: -10, x2: 50, y2: 7 },
        bottom: { x1: 50, y1: 75, x2: 50, y2: 90 },
    },
    or: {
        top: { x1: 50, y1: -10, x2: 50, y2: 10 },
        bottom: { x1: 50, y1: 64, x2: 50, y2: 90 },
    },
};

const GateSymbol = ({type}: { type: GateType }) => {
    const styles = gateStyleMap[type];
    const lines = gateLineMap[type];
    return (
        <svg
            viewBox="0 0 100 80"
            role="img"
            aria-label={`${styles.label} gate`}
            className={clsx("h-20 w-20 drop-shadow-[0_1px_6px_rgba(56,189,248,0.25)]", styles.text)}
        >
            <line x1={lines.top.x1} y1={lines.top.y1} x2={lines.top.x2} y2={lines.top.y2} stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <path
                d={gatePaths[type]}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinejoin="round"
                transform="rotate(-90 50 40)"
            />
            <line x1={lines.bottom.x1} y1={lines.bottom.y1} x2={lines.bottom.x2} y2={lines.bottom.y2} stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
};

export const AndGate = () => (
    <div className="flex flex-col items-center text-white/80">
        <GateSymbol type="and" />
    </div>
);

export const OrGate = () => (
    <div className="flex flex-col items-center text-white/80">
        <GateSymbol type="or" />
    </div>
);
