import clsx from "clsx";
import {ReactNode} from "react";
import {GateType} from "@/types/failureTree";

interface GateProps {
    inputs?: ReactNode[];
    outputs?: ReactNode[];
}

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

const ParentConnector = ({nodes}: { nodes: ReactNode[] }) => (
    <div className="flex flex-col items-center">
        {nodes.map((node, index) => (
            <div key={index} className="flex flex-col items-center">
                {node}
                <div className="h-6 w-0.5 bg-white/30" />
            </div>
        ))}
    </div>
);

const ChildrenConnector = ({nodes}: { nodes: ReactNode[] }) => (
    <div className="flex flex-col items-center">
        <div className="h-6 w-0.5 bg-white/30" />
        <div className="relative flex items-start gap-6 px-6">
            <div className="absolute left-0 right-0 top-0 h-px bg-white/30" />
            {nodes.map((node, index) => (
                <div key={index} className="flex flex-col items-center">
                    <div className="h-6 w-0.5 bg-white/30" />
                    {node}
                </div>
            ))}
        </div>
    </div>
);

const GateBody = ({type, hasParent, hasChildren}: { type: GateType; hasParent: boolean; hasChildren: boolean }) => (
    <div className="flex flex-col items-center">
        {hasParent && <div className="h-4 w-0.5 bg-white/30" />}
        <GateSymbol type={type} />
        {hasChildren && <div className="h-4 w-0.5 bg-white/30" />}
    </div>
);

const Gate = ({type, inputs = [], outputs = []}: GateProps & { type: GateType }) => (
    <div className="flex flex-col items-center gap-2 text-white/80">
        {outputs.length > 0 && <ParentConnector nodes={outputs} />}
        <GateBody type={type} hasParent={outputs.length > 0} hasChildren={inputs.length > 0} />
        {inputs.length > 0 && <ChildrenConnector nodes={inputs} />}
    </div>
);

export const AndGate = (props: GateProps) => <Gate type="and" {...props} />;

export const OrGate = (props: GateProps) => <Gate type="or" {...props} />;
