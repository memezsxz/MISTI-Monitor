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
        navName: 'notifications',
        defaultIcon: faBellRegular,
        activeIcon: faBellSolid,
        isActive: false,
    },
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

    const handleNavClick = (newState: NavOptions) => {
        setCurrentNavSelectedNav(currentNavSelectedNavOptions !== newState ? newState : '')
        console.log(newState)
    }

    const panel = () => {
        switch (currentNavSelectedNavOptions) {
            case 'notifications':
                return (<NotificationsPanel/>)
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

    return (
        <div className="fixed z-10 bottom-0 left-0 right-0">
            <div className={clsx("bg-zinc-800 h-15 flex justify-center items-center py-4 gap-3",
                isOpen ? "border-b-1 border-black" : "")}>
                {
                    NavItems.map(
                        (item, index) => {
                            item.isActive = currentNavSelectedNavOptions === item.navName
                            item.handleClick = handleNavClick
                            return <NavIcon key={'nav' + item.navName} {...item} />
                        }
                    )
                }
            </div>

            <div className={
                clsx(
                    "bg-zinc-800",
                    "grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] opacity-0 translate-y-2"
                )
            }>
                <div className="min-h-0 overflow-y-auto">
                    <div className="h-80 p-7">{panel()}</div>
                </div>
            </div>
        </div>
    )
}