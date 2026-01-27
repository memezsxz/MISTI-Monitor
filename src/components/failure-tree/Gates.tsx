import clsx from "clsx";
import {GateType} from "@/types/failureTree";

const gateStyleMap: Record<GateType, { text: string; label: string; }> = {
    and: {
        text: "text-cyan-300",
        label: "AND",
    },
    or: {
        text: "text-fuchsia-300",
        label: "OR",
    },
};

const gatePaths: Record<GateType, string> = {
    and: "M18 8 H52 Q82 8 82 40 Q82 72 52 72 H18 Z",
    or: "M18 8 Q40 40 18 72 Q34 72 68 72 Q92 40 68 8 Q34 8 18 8 Z",
};

const GateSymbol = ({type}: { type: GateType }) => {
    const styles = gateStyleMap[type];
    return (
        <svg
            viewBox="0 0 100 80"
            role="img"
            aria-label={`${styles.label} gate`}
            className={clsx("h-20 w-20", styles.text)}
        >
            <path
                d={gatePaths[type]}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinejoin="round"
                transform="rotate(-90 50 40)"
            />
        </svg>
    );
};

export const AndGate = () => (
    <div className="flex flex-col items-center text-white/80">
        <GateSymbol type="and" />
        <span className="text-xs uppercase tracking-[0.3em] text-white/60">{gateStyleMap.and.label}</span>
    </div>
);

export const OrGate = () => (
    <div className="flex flex-col items-center text-white/80">
        <GateSymbol type="or" />
        <span className="text-xs uppercase tracking-[0.3em] text-white/60">{gateStyleMap.or.label}</span>
    </div>
);
