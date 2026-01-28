import {FailureEvent} from "@/types/failureTree";
import clsx from "clsx";
import {ReactNode} from "react";

export type FailureEventVariant = "basic" | "failureMode" | "intermediate" | "top";

const variantStyleMap: Record<FailureEventVariant, { border: string; label: string; bg: string }> = {
    basic: {border: "border-white/80", bg: "bg-emerald-900", label: "Basic"},
    failureMode: {border: "border-white/80", bg: "bg-rose-900", label: "Failure Mode"},
    intermediate: {border: "border-white/80", bg: "bg-sky-950", label: "Intermediate"},
    top: {border: "border-white/80", bg: "bg-amber-900", label: "Top"},
};

export interface FailureEventCardProps {
    event: FailureEvent;
    variant?: FailureEventVariant;
    highlight?: boolean;
    children?: ReactNode;
}

export const FailureEventCard = ({
    event,
    variant = event.kind,
    highlight = false,
    children,
}: FailureEventCardProps) => {
    const styles = variantStyleMap[variant];
    const metrics: string[] = [];
    if (event.metrics?.severity) {
        metrics.push(`Severity: ${event.metrics.severity}`);
    }
    if (event.metrics?.detection) {
        metrics.push(`Detection: ${event.metrics.detection}`);
    }

    return (
        <div
            className={clsx(
                "group inline-flex w-64 flex-col items-center rounded-md border-2 px-4 py-3 text-white/85 backdrop-blur-sm transition-colors",
                styles.bg,
                styles.border,
                highlight && "ring-2 ring-white/30"
            )}
        >
            <p className="w-full text-center bg- text-base font-semibold text-white transition-all group-hover:text-left">
                {event.name}
            </p>
            <div className="max-h-0 w-full overflow-hidden opacity-0 transition-all duration-200 group-hover:max-h-64 group-hover:opacity-100">
                {/*<p className="mt-2 text-sm font-semibold uppercase tracking-wide text-white/70">{styles.label}</p>*/}

                {event.description && (
                    <p className="mt-1 text-sm text-white/70">{event.description}</p>
                )}

                {metrics.length > 0 && (
                    <p className="mt-2 text-xs text-white/60">{metrics.join(" • ")}</p>
                )}

                {/*{event.tags && event.tags.length > 0 && (*/}
                {/*    <div className="mt-2 flex flex-wrap gap-1">*/}
                {/*        {event.tags.map((tag) => (*/}
                {/*            <span key={tag} className="border border-white/15 px-2 py-[1px] text-[0.6rem] uppercase tracking-wide text-white/60">*/}
                {/*                {tag}*/}
                {/*            </span>*/}
                {/*        ))}*/}
                {/*    </div>*/}
                {/*)}*/}

                {children && <div className="mt-4">{children}</div>}
            </div>
        </div>
    );
};

export type FailureEventComponentProps = Omit<FailureEventCardProps, "variant">;

export const BasicEventCard = (props: FailureEventComponentProps) => (
    <FailureEventCard {...props} variant="basic" />
);

export const FailureModeCard = (props: FailureEventComponentProps) => (
    <FailureEventCard {...props} variant="failureMode" />
);

export const IntermediateEventCard = (props: FailureEventComponentProps) => (
    <FailureEventCard {...props} variant="intermediate" />
);

export const TopEventCard = (props: FailureEventComponentProps) => (
    <FailureEventCard {...props} variant="top" />
);
