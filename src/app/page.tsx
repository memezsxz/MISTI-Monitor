"use client";

import { Container } from "@/components/Container";
import { NavigationPanel } from "@/components/NavigationPanel";
import { PumpPlanView } from "@/components/PumpPlan";
import { NotificationsPanel } from "@/panels/NotificationsPanel";

export default function Home() {
  return (
    <div className="flex h-screen bg-zinc-900 font-sans">
      {/* Left sidebar with independent scroll */}
      <aside className="w-64 lg:w-72 xl:w-80 border-r border-zinc-700 overflow-y-auto h-screen">
        <NotificationsPanel />
      </aside>

      {/* Right content area with independent scroll */}
      <div className="flex-1 flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto p-8">
          <Container>
            <PumpPlanView />
          </Container>
        </main>

        {/* Bottom navigation stays fixed at bottom of right column */}
        <div className="border-t border-zinc-700">
          <NavigationPanel />
        </div>
      </div>
    </div>
  );
}
