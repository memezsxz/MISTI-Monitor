'use client'

import {
    faBell as faBellRegular,
    faComment as faCommentRegular,
    faFileLines as faFileLinesRegular
} from "@fortawesome/free-regular-svg-icons";

import {
    faBell as faBellSolid,
    faComment as faCommentSolid,
    faFileLines as faFileLinesSolid,
    faInfo
} from "@fortawesome/free-solid-svg-icons";
import {NavIcon, NavIconProps} from "@/components/NavIcon";
import {useState} from "react";
import clsx from "clsx";
import {NotificationsPanel} from "@/panels/NotificationsPanel";
import {AIPanel} from "@/panels/AIPanel";
import {TurnoverPanel} from "@/panels/TurnoverPanel";

export type NavOptions = '' | 'notifications' | 'comments' | 'notes' | 'info';

const NavItems: NavIconProps[] = [
    {
        navName: 'comments',
        defaultIcon: faCommentRegular,
        activeIcon: faCommentSolid,
        isActive: false,
    },
    {
        navName: 'notes',
        defaultIcon: faFileLinesRegular,
        activeIcon: faFileLinesSolid,
        isActive: false,
    },
    {
        navName: 'info',
        defaultIcon: faInfo,
        activeIcon: faInfo,
        isActive: false,
    },
]

export const NavigationPanel = () => {
    const [currentNavSelectedNavOptions, setCurrentNavSelectedNav] = useState('' as NavOptions);
    const [panelHeight, setPanelHeight] = useState(320); // default height
    const [dragging, setDragging] = useState(false);

    const handleNavClick = (newState: NavOptions) => {
        setCurrentNavSelectedNav(currentNavSelectedNavOptions !== newState ? newState : '')
    }

    const panel = () => {
        switch (currentNavSelectedNavOptions) {
            case 'comments':
                return (<AIPanel/>)
            case 'info':
                return (<p>Info</p>)
            case 'notes':
                return (<TurnoverPanel/>)
            default:
                return (<p>Nothing</p>)
        }
    }

    const isOpen = currentNavSelectedNavOptions !== "";

    // Drag handlers
    const startDrag = () => setDragging(true);
    const stopDrag = () => setDragging(false);
    const onDrag = (e: React.MouseEvent) => {
        if (dragging) {
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight > 150 && newHeight < 600) {
                setPanelHeight(newHeight);
            }
        }
    };

    return (
        <div
            className="fixed z-10 bottom-0 left-0 right-0"
            onMouseMove={onDrag}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
        >
            {/* Drag handle ABOVE icons */}
            {isOpen && (
                <div
                    className="h-2 cursor-row-resize bg-zinc-700 hover:bg-zinc-600"
                    onMouseDown={startDrag}
                />
            )}

            {/* Icon bar */}
            <div className={clsx(
                "bg-zinc-800 h-12 flex justify-center items-center py-4 gap-3",
                isOpen ? "border-b-1 border-black" : ""
            )}>
                {NavItems.map((item) => {
                    item.isActive = currentNavSelectedNavOptions === item.navName
                    item.handleClick = handleNavClick
                    return <NavIcon key={'nav' + item.navName} {...item} />
                })}
            </div>

            {/* Expanding panel */}
            <div
                className={clsx(
                    "bg-zinc-800",
                    "grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] opacity-0 translate-y-2"
                )}
                style={{ height: isOpen ? panelHeight : 0 }}
            >
                <div className="min-h-0 overflow-y-auto">
                    <div className="p-7">{panel()}</div>
                </div>
            </div>
        </div>
    )
}
