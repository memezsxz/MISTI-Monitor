"use client";

import {useEffect, useMemo, useState} from "react";
import {Container} from "@/components/Container";
import {getCacheWindowMs} from "@/lib/dataRefresh";
import {Line} from "react-chartjs-2";
import "chart.js/auto";
import type {ChartOptions} from "chart.js";

type TooltipInfo = {
    title: string;
    lines: string[];
};

type PartResponse = {
    part: {
        elementId: string;
        name: string | null;
        type: string;
        description: unknown;
    };
    tooltip: TooltipInfo;
    history: { ts: string; value: number | null }[];
};

export const InfoPanel = ({selectedPartId}: { selectedPartId: string | null }) => {
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<PartResponse | null>(null);

    useEffect(() => {
        if (!selectedPartId) {
            setData(null);
            setError(null);
            return;
        }

        let active = true;
        let intervalId: number | null = null;

        const fetchPart = () =>
            fetch(`/api/parts/${selectedPartId}`, {cache: "no-store"})
                .then(async (r) => {
                    if (!r.ok) throw new Error(await r.text());
                    return r.json();
                })
                .then((payload: PartResponse) => {
                    if (active) {
                        setError(null);
                        setData(payload);
                    }
                })
                .catch(() => {
                    if (active) setError("Could not load part details.");
                });

        fetchPart();
        intervalId = window.setInterval(fetchPart, getCacheWindowMs());

        return () => {
            active = false;
            if (intervalId != null) window.clearInterval(intervalId);
        };
    }, [selectedPartId]);

    const title = data?.tooltip?.title ?? data?.part?.name ?? selectedPartId;
    const lines = data?.tooltip?.lines ?? ["No data available."];
    const description = data?.part?.description ?? null;
    const partType = data?.part?.type;
    const elementId = data?.part?.elementId ?? "";
    const history = data?.history ?? [];
    const showChart = partType === "sensor";

    const sensorAxisLabel = useMemo(() => {
        if (partType !== "sensor") return "";
        const flowSensors = new Set(["sensor_1", "sensor_3", "sensor_6", "sensor_8"]);
        const tempSensors = new Set(["sensor_2", "sensor_4", "sensor_5", "sensor_7"]);
        if (flowSensors.has(elementId)) return "Flow (L/min)";
        if (tempSensors.has(elementId)) return "Temperature (C)";
        return "Value";
    }, [partType, elementId]);

    const parsedHistory = useMemo(
        () =>
            history.map((entry) => ({
                ts: entry.ts,
                label: new Date(entry.ts).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                value: entry.value,
            })),
        [history],
    );

    const chartData = useMemo(() => {
        if (!parsedHistory.length) return null;
        const plottedValues = parsedHistory.map((p) =>
            typeof p.value === "number" ? Number(p.value.toFixed(3)) : null,
        );
        if (plottedValues.every((v) => v == null)) return null;
        return {
            labels: parsedHistory.map((p) => p.label),
            datasets: [
                {
                    label: "Sensor value",
                    data: plottedValues,
                    fill: false,
                    borderColor: "rgba(16, 185, 129, 0.9)",
                    backgroundColor: "rgba(16, 185, 129, 0.3)",
                    tension: 0.3,
                    pointRadius: 0,
                    spanGaps: true,
                },
            ],
        };
    }, [parsedHistory]);

    const numericValues = parsedHistory
        .map((p) => p.value)
        .filter((v): v is number => typeof v === "number");
    const minValue = numericValues.length ? Math.min(...numericValues) : null;
    const maxValue = numericValues.length ? Math.max(...numericValues) : null;

    const chartOptions: ChartOptions<"line"> = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: "index" },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Value: ${context.parsed.y}`,
                    },
                },
            },
            scales: {
                x: {
                    ticks: { color: "#a1a1aa" },
                    grid: { color: "rgba(255,255,255,0.08)" },
                },
                y: {
                    ticks: { color: "#a1a1aa" },
                    grid: { color: "rgba(255,255,255,0.08)" },
                    title: sensorAxisLabel
                        ? { display: true, text: sensorAxisLabel, color: "#a1a1aa" }
                        : { display: false, text: "" },
                },
            },
        }),
        [sensorAxisLabel],
    );

    const style = "text-white/60 text-sm m-auto";
    if (!selectedPartId) {
        return <div className={style}>Select a part to view details.</div>;
    }

    const isLoading = !!selectedPartId && !data && !error;
    if (isLoading) {
        return <div className={style}>Loading…</div>;
    }

    if (error) {
        return <div className="text-red-400 text-sm">{error}</div>;
    }
    const descriptionText =
        description == null
            ? "No description available."
            : typeof description === "string"
                ? (() => {
                    try {
                        return JSON.stringify(JSON.parse(description), null, 2);
                    } catch {
                        return description;
                    }
                })()
                : JSON.stringify(description, null, 2);

    return (
        <div className="space-y-2 text-white/80 text-sm">
            <div className="text-white/90 font-semibold">{title}</div>
            <div className="text-white/60 text-xs">ID: {selectedPartId}</div>
            <div className="space-y-1">
                {lines.map((line) => (
                    <div key={line}>{line}</div>
                ))}
            </div>
            <div className="text-white/50 text-xs">Description</div>
            <pre className="whitespace-pre-wrap rounded-lg bg-white/5 p-3 text-xs text-white/70">
                {descriptionText}
            </pre>
            {showChart ? (
                <Container>
                    {chartData ? (
                        <div className="space-y-2">
                            <div className="h-40">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-h-[140px] items-center justify-center text-xs text-white/60">
                            No readings in the past hour.
                        </div>
                    )}
                </Container>
            ) : null}
        </div>
    );
};
