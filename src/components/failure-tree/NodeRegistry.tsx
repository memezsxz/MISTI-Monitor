import {createContext, ReactNode, useCallback, useContext, useMemo, useRef} from "react";

type NodeMap = Map<string, HTMLElement>;

interface NodeRegistryContextValue {
    nodes: NodeMap;
    registerNode: (id: string, element: HTMLElement) => void;
    unregisterNode: (id: string) => void;
    subscribe: (listener: () => void) => () => void;
    notifyChange: () => void;
}

const NodeRegistryContext = createContext<NodeRegistryContextValue | null>(null);

export const NodeRegistryProvider = ({children}: {children: ReactNode}) => {
    const nodesRef = useRef<NodeMap>(new Map());
    const listenersRef = useRef(new Set<() => void>());

    const notifyChange = useCallback(() => {
        listenersRef.current.forEach((listener) => listener());
    }, []);

    const registerNode = useCallback((id: string, element: HTMLElement) => {
        nodesRef.current.set(id, element);
        notifyChange();
    }, [notifyChange]);

    const unregisterNode = useCallback((id: string) => {
        nodesRef.current.delete(id);
        notifyChange();
    }, [notifyChange]);

    const subscribe = useCallback((listener: () => void) => {
        listenersRef.current.add(listener);
        return () => {
            listenersRef.current.delete(listener);
        };
    }, []);

    const value = useMemo<NodeRegistryContextValue>(() => ({
        nodes: nodesRef.current,
        registerNode,
        unregisterNode,
        subscribe,
        notifyChange,
    }), [registerNode, unregisterNode, subscribe, notifyChange]);

    return (
        <NodeRegistryContext.Provider value={value}>
            {children}
        </NodeRegistryContext.Provider>
    );
};

export const useNodeRegistry = () => {
    const ctx = useContext(NodeRegistryContext);
    if (!ctx) {
        throw new Error("useNodeRegistry must be used within NodeRegistryProvider");
    }
    return ctx;
};
