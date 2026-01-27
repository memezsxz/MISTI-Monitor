import {ReactNode, useCallback, useRef} from "react";
import {useNodeRegistry} from "@/components/failure-tree/NodeRegistry";

interface TreeNodeProps {
    id: string;
    className?: string;
    children: ReactNode;
}

export const TreeNode = ({id, className, children}: TreeNodeProps) => {
    const {registerNode, unregisterNode} = useNodeRegistry();
    const previousElement = useRef<HTMLDivElement | null>(null);

    const refCallback = useCallback((element: HTMLDivElement | null) => {
        if (previousElement.current === element) {
            return;
        }

        if (element) {
            registerNode(id, element);
            previousElement.current = element;
            return;
        }

        if (previousElement.current) {
            unregisterNode(id);
            previousElement.current = null;
        }
    }, [id, registerNode, unregisterNode]);

    return (
        <div ref={refCallback} data-node-id={id} className={className}>
            {children}
        </div>
    );
};
