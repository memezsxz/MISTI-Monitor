"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {Container} from "@/components/Container";
import {PumpPlanView} from "@/components/PumpPlan";
import {RadialSimMenu} from "@/components/RadialSimMenu";
import {getCacheWindowMs} from "@/lib/dataRefresh";
import type {PumpPlanMetrics, StatusSeverity} from "@/types/pumpPlan";

const statusTone: Record<StatusSeverity, string> = {
    normal: "text-emerald-300",
    warning: "text-amber-300",
    critical: "text-rose-300",
    unknown: "text-white/70",
};

export const PumpPlanPanel = ({onSelectPart}: { onSelectPart: (id: string) => void }) => {
    const runAnalysis = useCallback(async () => {
        try {
            await fetch("/api/analysis/check", {method: "POST"});
        } catch (err) {
            console.error("AI analysis check failed", err);
        }
    }, []);

    const [metrics, setMetrics] = useState<PumpPlanMetrics | null>(null);
    const [metricsError, setMetricsError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        runAnalysis().catch(() => undefined);
        const intervalId = window.setInterval(() => {
            if (cancelled) return;
            runAnalysis().catch(() => undefined);
        }, getCacheWindowMs());

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [runAnalysis]);

    useEffect(() => {
        let cancelled = false;

        const fetchMetrics = async () => {
            try {
                const res = await fetch("/api/pump-plan/metrics", {cache: "no-store"});
                if (!res.ok) throw new Error(await res.text());
                const data = (await res.json()) as PumpPlanMetrics;
                if (cancelled) return;
                setMetrics(data);
                setMetricsError(null);
            } catch (err) {
                if (!cancelled) {
                    console.error("Failed to load pump KPIs", err);
                    setMetricsError("Unable to load KPIs.");
                }
            }
        };

        fetchMetrics().catch(() => undefined);
        const intervalId = window.setInterval(() => {
            if (cancelled) return;
            fetchMetrics().catch(() => undefined);
        }, getCacheWindowMs());

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, []);

    const kpis = useMemo<Array<{ label: string; value: string; severity?: StatusSeverity }>>(() => {
        const formatValue = (value: number | null, unit: string, digits = 1) => {
            if (value == null) return `— ${unit}`;
            return `${value.toFixed(digits)} ${unit}`;
        };

        return [
            {label: "Flow", value: formatValue(metrics?.flowLpm ?? null, "L/min", 2)},
            {label: "Pressure", value: formatValue(metrics?.pressureKpa ?? null, "kPa", 1)},
            {label: "Temperature", value: formatValue(metrics?.temperatureC ?? null, "°C", 1)},
            {
                label: "Status",
                value: metrics?.status?.label ?? "—",
                severity: metrics?.status?.severity ?? "unknown",
            },
        ];
    }, [metrics]);

    return (
        <div className="grid gap-3">
            <RadialSimMenu
                defaultScenarioId="normal"
                options={[
                    {id: "normal", label: "Normal"},
                    {id: "blockage", label: "Blockage"},
                    {id: "leak", label: "Leak"},
                    {id: "overheat", label: "Overheat"},
                    {id: "pumpfail", label: "Pump Failure"},
                ]}
                onSelect={() => {
                    runAnalysis().catch(() => undefined);
                }}
            />

            <Container>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {kpis.map((kpi) => (
                        <div
                            key={kpi.label}
                            className="rounded-xl border border-white/10 bg-zinc-900/70 p-4 text-white/80"
                        >
                            <div className="text-xs text-white/50">{kpi.label}</div>
                            <div
                                className={`mt-1 text-lg font-semibold ${
                                    kpi.label === "Status"
                                        ? statusTone[(kpi.severity ?? "unknown")]
                                        : "text-white/90"
                                }`}
                            >
                                {kpi.value}
                            </div>
                        </div>
                    ))}
                </div>
                {/*{metricsError ? (*/}
                {/*    <div className="mt-2 text-xs text-rose-300">{metricsError}</div>*/}
                {/*) : null}*/}
            </Container>

            <Container>
                <PumpPlanView
                    onSelectPart={async (id) => onSelectPart(id)}
                />
            </Container>
        </div>
    );
};
