import type { PumpCondition } from "@/lib/aiAnalize";

export type StatusSeverity = "normal" | "warning" | "critical" | "unknown";

export type PumpPlanMetrics = {
    flowLpm: number | null;
    temperatureC: number | null;
    pressureKpa: number | null;
    status: {
        code: PumpCondition | "unknown";
        label: string;
        severity: StatusSeverity;
    };
    updatedAt: string | null;
};
