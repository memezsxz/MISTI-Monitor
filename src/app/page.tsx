"use client";

import {NavigationPanel} from "@/components/NavigationPanel";
import {FailureTreePanel} from "@/panels/FailureTreePanel";
import {PumpPlanPanel} from "@/panels/PumpPlanPanel";
import {useState} from "react";

export default function Home() {
    const [currentNav, setCurrentNav] = useState<"" | "notifications" | "comments" | "notes" | "info">("");
    const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
    const [panelMode, setPanelMode] = useState<"plan" | "failure">("plan");

    return (
        <>
                <div className="flex min-h-screen items-stretch font-sans bg-zinc-900">
                    <NavigationPanel
                        currentNav={currentNav}
                        onNavChange={setCurrentNav}
                        selectedPartId={selectedPartId}
                    />
                    <main className="flex-1 flex items-center justify-center transition-all duration-300 ease-out">
                        <div className="w-full max-w-3xl px-16 py-20 sm:py-32 grid gap-3">
                            <div className="flex justify-center pb-3">
                                <div className="inline-flex w-fit rounded-lg border border-white/10 bg-white/5 p-1 text-xs text-white/80">
                                <button
                                    type="button"
                                    onClick={() => setPanelMode("plan")}
                                    className={`rounded-md px-3 py-1.5 font-semibold ${panelMode === "plan" ? "bg-white/10" : "text-white/70 hover:text-white/90"}`}
                                >
                                    Plan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPanelMode("failure")}
                                    className={`rounded-md px-3 py-1.5 font-semibold ${panelMode === "failure" ? "bg-white/10" : "text-white/70 hover:text-white/90"}`}
                                >
                                    Failure Tree
                                </button>
                                </div>
                            </div>
                            {panelMode === "plan" ? (
                                <PumpPlanPanel
                                    onSelectPart={(id) => {
                                        setCurrentNav("info");
                                        setSelectedPartId(id);
                                    }}
                                />
                            ) : (
                                <FailureTreePanel />
                            )}
                        </div>
                    </main>
                </div>
        </>
    );
}
