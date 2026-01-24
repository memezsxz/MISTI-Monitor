import {useEffect, useState} from "react";
import {Notification} from "@/db/schema";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCircle,
    faTriangleExclamation,
    faExclamation,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";

function levelStyles(level: "low" | "medium" | "high") {
    switch (level) {
        case "low":
            return {
                card: "bg-emerald-900/25 hover:bg-emerald-900/30 border-emerald-300/20",
                pill: "bg-emerald-200/70 text-emerald-950",
                dot: "bg-emerald-300/80",
            };
        case "medium":
            return {
                card: "bg-amber-900/25 hover:bg-amber-900/30 border-amber-300/20",
                pill: "bg-amber-200/70 text-amber-950",
                dot: "bg-amber-300/80",
            };
        case "high":
            return {
                card: "bg-rose-900/25 hover:bg-rose-900/30 border-rose-300/20",
                pill: "bg-rose-200/70 text-rose-950",
                dot: "bg-rose-300/80",
            };
    }
}

export const NotificationsPanel = () => {
    const [rows, setRows] = useState<Notification[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);


    useEffect(() => {
        fetch("/api/notifications")
            .then(async (r) => {
                if (!r.ok) throw new Error(await r.text());
                return r.json();
            })
            .then((data: Notification[]) => {
                setRows(data);
                setSelectedNotification(data[0] ?? null); // optional: auto-select first
            })
            .catch((err) => {
                console.error(err);
                setError("Could not fetch notifications from the database.");
            });
    }, []);

    if (error) {
        console.error(error)
        return (
            <p className="text-center text-red-500 text-xl text-shadow-sm  ">
            Could not fetch notifications from the database.</p>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-10 justify-self-center w-full h-full p-5">
            <div className=" grid gap-2">
                {rows.map((n) => {
                    const badge = (() => {
                        switch (n.category) {
                            case "low":
                                return { icon: faCircle, cls: "text-green-300" };
                            case "medium":
                                return { icon: faTriangleExclamation, cls: "text-yellow-300" };
                            case "high":
                                return { icon: faExclamation, cls: "text-red-300" };
                        }
                    })();

                    return (
                        <div
                            key={`notification-${n.id}`}
                            onClick={() => setSelectedNotification(n)}
                            className={clsx(
                                "rounded px-3 py-2 cursor-pointer text-white",
                                n.category === "low" && "bg-green-700 hover:bg-green-600",
                                n.category === "medium" && "bg-yellow-700 hover:bg-yellow-600",
                                n.category === "high" && "bg-red-700 hover:bg-red-600",
                                selectedNotification?.id === n.id && "ring-2 ring-white/60"
                            )}
                        >

                            <div className="flex items-center gap-3">
                                {/* icon */}
                                <div
                                    className={clsx(
                                        "shrink-0 w-5 h-5 grid place-items-center rounded-full border border-white/20",
                                        badge.cls
                                    )}
                                >
                                    <FontAwesomeIcon className="text-[0.55rem]" icon={badge.icon} />
                                </div>

                                {/* title takes remaining space */}
                                <p className="flex-1 min-w-0 font-semibold truncate">
                                    {n.title}
                                </p>

                                {/* date shrinks / stays small */}
                                <p className="shrink-0 text-xs text-white/70">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                        </div>
                    );
                })}

            </div>
            <div className="bg-red-900 rounded p-4">
                {selectedNotification ? (
                    <>
                        <div className="text-lg font-bold">{selectedNotification.title}</div>
                        <div className="mt-1 text-sm opacity-80">
                            Category: {selectedNotification.category} •{" "}
                            {new Date(selectedNotification.createdAt).toLocaleString()}
                        </div>

                        <p className="mt-4">{selectedNotification.message}</p>

                        <div className="mt-4 text-sm opacity-80">
                            Read: {selectedNotification.isRead ? "Yes" : "No"}
                        </div>
                    </>
                ) : (
                    <p className="opacity-80">Select a notification to see details.</p>
                )}
            </div>
        </div>
    );
};