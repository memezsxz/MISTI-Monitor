import {CSSProperties, ReactNode, useCallback, useEffect, useRef} from "react";
import {useNodeRegistry} from "@/components/failure-tree/NodeRegistry";

interface TreeNodeProps {
    id: string;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}

export const TreeNode = ({id, className, style, children}: TreeNodeProps) => {
    const {registerNode, unregisterNode, notifyChange} = useNodeRegistry();
    const previousElement = useRef<HTMLDivElement | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    const cleanupObserver = useCallback(() => {
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
            resizeObserverRef.current = null;
        }
    }, []);

    const setupObserver = useCallback((element: HTMLDivElement | null) => {
        cleanupObserver();
        if (!element) return;
        resizeObserverRef.current = new ResizeObserver(() => notifyChange());
        resizeObserverRef.current.observe(element);
    }, [cleanupObserver, notifyChange]);

    const refCallback = useCallback((element: HTMLDivElement | null) => {
        if (previousElement.current === element) {
            return;
        }

        if (element) {
            registerNode(id, element);
            previousElement.current = element;
            setupObserver(element);
            return;
        }

        if (previousElement.current) {
            unregisterNode(id);
            previousElement.current = null;
            cleanupObserver();
        }
    }, [cleanupObserver, id, registerNode, setupObserver, unregisterNode]);

    useEffect(() => () => {
        cleanupObserver();
    }, [cleanupObserver]);

    return (
        <div ref={refCallback} data-node-id={id} className={className} style={style}>
            {children}
        </div>
    );
};
