"use client";

import {Container} from "@/components/Container";
import {NavigationPanel} from "@/components/NavigationPanel";
import {PumpPlanView} from "@/components/PumpPlan";
import {useState} from "react";

export default function Home() {
    const [currentNav, setCurrentNav] = useState<"" | "notifications" | "comments" | "notes" | "info">("");
    const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

    return (
        <>
            <div className="bg-zinc-900">
                <div className="flex min-h-full h-300  items-center justify-center  font-sans bg-zinc-900">
                    <main
                        className="flex  w-full max-w-3xl flex-col items-center justify-between py-32 px-16  sm:items-start">
                        <Container>
                            <PumpPlanView
                                onSelectPart={async (id) => {
                                    setCurrentNav("info");
                                    setSelectedPartId(id);
                                }}
                            />
                            {/*<Image src="/pump_plan.svg" alt="pump plan" width={800} height={1200} priority />*/}
                            {/*<img src="@/public/pump_plan.svg" alt="pump plan"/>*/}
                            {/*<p>sadasda</p>*/}
                        </Container>
                    </main>
                </div>
                <NavigationPanel
                    currentNav={currentNav}
                    onNavChange={setCurrentNav}
                    selectedPartId={selectedPartId}
                />
            </div>
        </>
    );
}
