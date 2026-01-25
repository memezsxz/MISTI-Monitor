"use client";

import {NavigationPanel} from "@/components/NavigationPanel";
import {FailureTreePanel} from "@/panels/FailureTreePanel";
import {PumpPlanPanel} from "@/panels/PumpPlanPanel";
import {useState} from "react";

export default function Home() {
    const [currentNav, setCurrentNav] = useState<"" | "notifications" | "comments" | "notes" | "info">("");
    const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
    const [panelMode, setPanelMode] = useState<"plan" | "failure">("plan");

    const style = (type: string) => {
        return `rounded-md px-3 py-1.5 font-semibold ${panelMode === type ? "bg-white/10" : "text-white/70 hover:text-white/90"}`
    }
    return (
        <>
                <div className="flex min-h-screen items-stretch font-sans bg-zinc-900">
                    <NavigationPanel
                        currentNav={currentNav}
                        onNavChange={setCurrentNav}
                        selectedPartId={selectedPartId}
                    />
                    <main className="flex-1 flex py-10 pt-15 items-center justify-center transition-all duration-300 ease-out">
                        <div className="w-full max-w-[70%] grid gap-3">
                            <div className="flex justify-center pb-15">
                                <div className="inline-flex w-fit rounded-lg border border-white/10 bg-white/5 p-1 text-xs text-white/80">
                                <button
                                    type="button"
                                    onClick={() => setPanelMode("plan")}
                                    className={style("plan")}
                                >
                                    Plan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPanelMode("failure")}
                                    className={style("failure")}
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
