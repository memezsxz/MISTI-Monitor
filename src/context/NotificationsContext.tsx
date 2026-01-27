'use client';

import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {Notification} from "@/db/schema";
import {getCacheWindowMs} from "@/lib/dataRefresh";

export type NotificationPayload = {
    active: Notification[];
    history: Notification[];
};

type NotificationsContextValue = {
    payload: NotificationPayload;
    loading: boolean;
    error: string | null;
    acknowledge: (id: number) => Promise<void>;
    resolve: (id: number) => Promise<void>;
    refresh: () => Promise<void>;
    autoOpenRequested: boolean;
    clearAutoOpen: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as T;
}

export const NotificationsProvider = ({children}: {children: React.ReactNode}) => {
    const [payload, setPayload] = useState<NotificationPayload>({active: [], history: []});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoOpenRequested, setAutoOpenRequested] = useState(false);
    const cacheRef = useRef<{data: NotificationPayload; ts: number} | null>(null);
    const highAlertIdsRef = useRef<Set<number>>(new Set());
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const initAudio = useCallback(() => {
        if (audioRef.current) return;
        audioRef.current = new Audio("/alert.mp3");
        audioRef.current.loop = true;
    }, []);

    useEffect(() => {
        const onInteract = () => {
            initAudio();
            document.removeEventListener("click", onInteract);
        };
        document.addEventListener("click", onInteract);
        return () => document.removeEventListener("click", onInteract);
    }, [initAudio]);

    const playAlarm = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const playPromise = audio.play();
        if (playPromise) playPromise.catch((err) => console.error("Failed to play alarm", err));
    }, []);

    const stopAlarm = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
    }, []);

    const fetchNotifications = useCallback(async (force = false) => {
        const cacheWindow = getCacheWindowMs();
        const now = Date.now();
        if (!force && cacheRef.current && now - cacheRef.current.ts < cacheWindow) {
            setPayload(cacheRef.current.data);
            return cacheRef.current.data;
        }
        try {
            const data = await fetchJson<NotificationPayload>("/api/notifications", {cache: "no-store"});
            cacheRef.current = {data, ts: Date.now()};
            setPayload(data);
            setError(null);
            return data;
        } catch (err) {
            console.error("Failed to fetch notifications", err);
            setError("Could not fetch notifications from the database.");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                await fetchNotifications(true);
            } catch (err) {
                if (!cancelled) setError("Could not fetch notifications from the database.");
            }
        };
        load().catch(() => undefined);
        const interval = window.setInterval(() => {
            if (cancelled) return;
            fetchNotifications().catch(() => undefined);
        }, getCacheWindowMs());
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [fetchNotifications]);

    useEffect(() => {
        const highUnacked = payload.active.filter((n) => n.level === "high" && !n.acknowledgedAt);
        const newIds = new Set(highUnacked.map((n) => n.id));
        const hasNew = highUnacked.some((n) => !highAlertIdsRef.current.has(n.id));
        if (hasNew) {
            setAutoOpenRequested(true);
        }
        if (highUnacked.length > 0) {
            playAlarm();
        } else {
            stopAlarm();
        }
        highAlertIdsRef.current = newIds;
    }, [payload.active, playAlarm, stopAlarm]);

    const mutateNotification = useCallback(
        async (id: number, action: "acknowledge" | "resolve") => {
            await fetchJson(`/api/notifications/${id}/${action}`, {method: "POST"});
            cacheRef.current = null;
            await fetchNotifications(true);
        },
        [fetchNotifications],
    );

    const value = useMemo<NotificationsContextValue>(() => ({
        payload,
        loading,
        error,
        acknowledge: (id: number) => mutateNotification(id, "acknowledge"),
        resolve: (id: number) => mutateNotification(id, "resolve"),
        refresh: () => fetchNotifications(true),
        autoOpenRequested,
        clearAutoOpen: () => setAutoOpenRequested(false),
    }), [payload, loading, error, mutateNotification, fetchNotifications, autoOpenRequested]);

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export function useNotifications() {
    const ctx = useContext(NotificationsContext);
    if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
    return ctx;
}
