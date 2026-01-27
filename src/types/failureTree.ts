export type FailureEventKind = "basic" | "failureMode" | "intermediate" | "top";

export interface FailureEventMetrics {
    probability?: number;
    severity?: "low" | "medium" | "high" | "critical";
    detection?: "low" | "medium" | "high";
}

export interface FailureEvent {
    id: string;
    name: string;
    kind: FailureEventKind;
    description?: string;
    metrics?: FailureEventMetrics;
    metadata?: Record<string, string | number>;
    tags?: string[];
}

export type GateType = "and" | "or";

export interface FailureGate {
    id: string;
    type: GateType;
    inputEventIds: string[];
    outputEventIds: string[];
    label?: string;
}
