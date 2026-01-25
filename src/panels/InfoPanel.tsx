"use client";

import {useEffect, useState} from "react";
import {Container} from "@/components/Container";

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
};

export const InfoPanel = ({selectedPartId}: { selectedPartId: string | null }) => {
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<PartResponse | null>(null);

    useEffect(() => {
        if (!selectedPartId) return;

        let active = true;

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

        return () => {
            active = false;
        };
    }, [selectedPartId]);

    const style = "text-white/60 text-sm m-auto"
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

    const title = data?.tooltip?.title ?? data?.part?.name ?? selectedPartId;
    const lines = data?.tooltip?.lines ?? ["No data available."];
    const description = data?.part?.description ?? null;
    const partType = data?.part?.type;
    const showChart = partType !== "connector" && partType !== "valve";
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
                    <div className="flex min-h-[140px] items-center justify-center text-xs text-white/60">
                        Chart placeholder
                    </div>
                </Container>
            ) : null}
        </div>
    );
};
