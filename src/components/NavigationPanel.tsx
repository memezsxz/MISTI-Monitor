'use client'

import { ReactNode, JSX } from "react";
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
import {InfoPanel} from "@/panels/InfoPanel";

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

export const NavigationPanel = ({
  currentNav,
  onNavChange,
  selectedPartId,
}: {
  currentNav?: NavOptions;
  onNavChange?: (nav: NavOptions) => void;
  selectedPartId?: string | null;
}) => {
  const [internalNav, setInternalNav] = useState<NavOptions>("");
  const currentNavSelectedNavOptions = currentNav ?? internalNav;

  const handleNavClick = (newState: NavOptions) => {
    const next = currentNavSelectedNavOptions !== newState ? newState : "";
    if (onNavChange) {
      onNavChange(next);
    } else {
      setInternalNav(next);
    }
  };

  const panels: Record<NavOptions, JSX.Element> = {
      "": <p> </p>,
    notifications: <NotificationsPanel />,
    comments: <AIPanel />,
    notes: <TurnoverPanel />,
    info: <InfoPanel selectedPartId={selectedPartId ?? null} />,
  };

  const isOpen = currentNavSelectedNavOptions !== "";

  return (
    <div className="fixed top-0 left-0 h-full flex z-10">
      {/* Sidebar with icons */}

      <div 
      className={clsx( 
        "bg-zinc-800 w-16 h-full flex flex-col items-center justify-center gap-6", 
        isOpen && "border-r border-black" 
        )} 
        > 
        {NavItems.map((item) => ( 
            <NavIcon key={"nav" + item.navName} 
            {...item} 
            isActive={currentNavSelectedNavOptions === item.navName} 
            handleClick={handleNavClick} 
            /> 
        ))} 
    </div>

      {/* Panel content */}
      <div
        className={clsx(
          "bg-zinc-800 transition-all duration-300 ease-out overflow-hidden",
          isOpen ? "w-96 opacity-100 translate-x-0" : "w-0 opacity-0 translate-x-2"
        )}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-3">{panels[currentNavSelectedNavOptions]}</div>
        </div>
      </div>
    </div>
  );
};
