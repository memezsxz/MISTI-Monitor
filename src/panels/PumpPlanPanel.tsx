"use client";

import {Container} from "@/components/Container";
import {PumpPlanView} from "@/components/PumpPlan";
import {RadialSimMenu} from "@/components/RadialSimMenu";

export const PumpPlanPanel = ({onSelectPart}: { onSelectPart: (id: string) => void }) => {
    return (
        <div className="grid gap-3">
            <RadialSimMenu
                defaultScenarioId="normal"
                options={[
                    {id: "normal", label: "Normal"},
                    {id: "blockage", label: "Blockage"},
                    {id: "leak", label: "Leak"},
                    {id: "overheat", label: "Overheat"},
                ]}
            />

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
