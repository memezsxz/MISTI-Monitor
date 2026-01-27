"use client";

import {useRef} from "react";
import {Container} from "@/components/Container";
import {
    BasicEventCard,
    FailureModeCard,
    IntermediateEventCard,
    TopEventCard
} from "@/components/failure-tree/EventCard";
import {AndGate, OrGate} from "@/components/failure-tree/Gates";
import {ConnectorLayer, TreeEdge} from "@/components/failure-tree/ConnectorLayer";
import {NodeRegistryProvider} from "@/components/failure-tree/NodeRegistry";
import {TreeNode} from "@/components/failure-tree/TreeNode";
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

    const edges: TreeEdge[] = [
        {from: "top-event", to: "gate-and"},
        {from: "gate-and", to: "failure-mode"},
        {from: "gate-and", to: "intermediate"},
        {from: "failure-mode", to: "gate-or"},
        {from: "gate-or", to: "temp"},
        {from: "gate-or", to: "valve"},
        {from: "gate-or", to: "operator"},
    ];

    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <Container>
            <NodeRegistryProvider>
                <div ref={containerRef} className="relative flex flex-col items-center gap-10 text-white/80">
                    <ConnectorLayer containerRef={containerRef} edges={edges} />
                    <div className="text-sm text-white/60">
                        Manual tree layout with SVG connectors drawn per edge.
                    </div>
                    <TreeNode id="top-event" className="z-10">
                        <TopEventCard event={events.top} highlight />
                    </TreeNode>
                    <TreeNode id="gate-and" className="z-10">
                        <AndGate />
                    </TreeNode>
                    <div className="grid gap-8 lg:grid-cols-2">
                        <TreeNode id="failure-mode" className="z-10 flex justify-center">
                            <FailureModeCard event={events.failureMode} />
                        </TreeNode>
                        <TreeNode id="intermediate" className="z-10 flex justify-center">
                            <IntermediateEventCard event={events.intermediate} />
                        </TreeNode>
                    </div>
                    <TreeNode id="gate-or" className="z-10">
                        <OrGate />
                    </TreeNode>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <TreeNode id="temp" className="z-10 flex justify-center">
                            <BasicEventCard event={events.tempSpike} />
                        </TreeNode>
                        <TreeNode id="valve" className="z-10 flex justify-center">
                            <BasicEventCard event={events.valveClog} />
                        </TreeNode>
                        <TreeNode id="operator" className="z-10 flex justify-center">
                            <BasicEventCard event={events.operatorMiss} />
                        </TreeNode>
                    </div>
                </div>
            </NodeRegistryProvider>
        </Container>
    );
};
