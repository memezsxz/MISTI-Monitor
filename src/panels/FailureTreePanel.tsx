"use client";

import {Container} from "@/components/Container";
import {
    BasicEventCard,
    FailureModeCard,
    IntermediateEventCard,
    TopEventCard
} from "@/components/failure-tree/EventCard";
import {AndGate, OrGate} from "@/components/failure-tree/Gates";
import {FailureEvent} from "@/types/failureTree";

export const FailureTreePanel = () => {
    const events: Record<string, FailureEvent> = {
        top: {
            id: "top",
            name: "Pump Shutdown",
            kind: "top",
            description: "System level outage triggered by cascading failures in the cooling loop.",
            metrics: {probability: 0.08, severity: "critical"},
            tags: ["system", "downtime"],
        },
        failureMode: {
            id: "failureMode",
            name: "Cooling Loop Failure",
            kind: "failureMode",
            description: "Primary cooling loop unable to dissipate heat.",
            metrics: {probability: 0.18, severity: "high", detection: "medium"},
            tags: ["cooling"],
        },
        intermediate: {
            id: "intermediate",
            name: "Excess Thermal Load",
            kind: "intermediate",
            description: "Combined effect of demand spikes and component drift.",
            metrics: {probability: 0.25, severity: "high"},
        },
        tempSpike: {
            id: "basic-1",
            name: "Temperature Spike",
            kind: "basic",
            description: "Ambient temps exceed safe operating window.",
            metrics: {probability: 0.32},
            tags: ["environment"],
        },
        valveClog: {
            id: "basic-2",
            name: "Valve Clogging",
            kind: "basic",
            description: "Sediment buildup restricts flow.",
            metrics: {probability: 0.22},
        },
        operatorMiss: {
            id: "basic-3",
            name: "Operator Miss",
            kind: "basic",
            description: "Manual override not engaged in time.",
            metrics: {probability: 0.11},
            tags: ["human"],
        },
    };

    return (
        <Container>
            <div className="flex flex-col items-center gap-6 text-white/80">
                <p className="text-sm text-white/60">Prototype tree view using basic event cards and Boolean gates.</p>
                <AndGate
                    outputs={[
                        <div key="top" className="w-full max-w-xs">
                            <TopEventCard event={events.top} highlight />
                        </div>,
                    ]}
                    inputs={[
                        <OrGate
                            key="or"
                            outputs={[
                                <div key="fm-card" className="w-full max-w-xs">
                                    <FailureModeCard event={events.failureMode} />
                                </div>,
                            ]}
                            inputs={[
                                <div key="temp" className="w-full max-w-xs">
                                    <BasicEventCard event={events.tempSpike} />
                                </div>,
                                <div key="valve" className="w-full max-w-xs">
                                    <BasicEventCard event={events.valveClog} />
                                </div>,
                                <div key="operator" className="w-full max-w-xs">
                                    <BasicEventCard event={events.operatorMiss} />
                                </div>,
                            ]}
                        />,
                        <div key="intermediate" className="w-full max-w-xs">
                            <IntermediateEventCard event={events.intermediate} />
                        </div>,
                    ]}
                />
            </div>
        </Container>
    );
};
