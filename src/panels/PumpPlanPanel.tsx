"use client";

import {Container} from "@/components/Container";
import {PumpPlanView} from "@/components/PumpPlan";

export const PumpPlanPanel = ({onSelectPart}: { onSelectPart: (id: string) => void }) => {
    return (
        <div className="grid gap-3">
            <Container>
                <div className="flex flex-wrap gap-3">
                    {[
                        "Simulate Normal",
                        "Simulate Blockage",
                        "Simulate Leak",
                        "Simulate Overheat",
                    ].map((label) => (
                        <button
                            key={label}
                            type="button"
                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </Container>

            <Container>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        {label: "Flow", value: "— L/min"},
                        {label: "Pressure", value: "— kPa"},
                        {label: "Temperature", value: "— °C"},
                        {label: "Status", value: "—"},
                    ].map((kpi) => (
                        <div
                            key={kpi.label}
                            className="rounded-xl border border-white/10 bg-zinc-900/70 p-4 text-white/80"
                        >
                            <div className="text-xs text-white/50">{kpi.label}</div>
                            <div className="mt-1 text-lg font-semibold text-white/90">
                                {kpi.value}
                            </div>
                        </div>
                    ))}
                </div>
            </Container>

            <Container>
                <PumpPlanView
                    onSelectPart={async (id) => onSelectPart(id)}
                />
            </Container>
        </div>
    );
};
