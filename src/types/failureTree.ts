export type FailureEventKind = "basic" | "failureMode" | "intermediate" | "top";
export type FailureEventRecordKind = "basic" | "failure_mode" | "intermediate" | "top" | "gate_and" | "gate_or";
export type FailureEventSeverity = "low" | "medium" | "high" | "critical";
export type FailureEventDetection = "low" | "medium" | "high";

export interface FailureEventMetrics {
    probability?: number;
    severity?: FailureEventSeverity;
    detection?: FailureEventDetection;
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

export interface FailureTreeNodePayload {
    id: string;
    name: string;
    kind: FailureEventRecordKind;
    description: string | null;
    probability: number | null;
    severity: FailureEventSeverity | null;
    detection: FailureEventDetection | null;
    metadata: Record<string, string | number> | null;
    tags: string[] | null;
    position: { x: number; y: number };
}

export interface FailureTreeEdgePayload {
    id: string;
    fromEventId: string;
    toEventId: string;
    linkType: string | null;
    metadata: Record<string, string | number> | null;
}

export interface FailureTreeData {
    nodes: FailureTreeNodePayload[];
    edges: FailureTreeEdgePayload[];
}
