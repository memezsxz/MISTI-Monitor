import {IconDefinition} from "@fortawesome/fontawesome-common-types";
import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {NavOptions} from "@/components/NavigationPanel";

export type NavIconProps = {
    navName: NavOptions,
    defaultIcon: IconDefinition,
    activeIcon: IconDefinition,
    isActive: boolean ,
    handleClick?: (navName: NavOptions) => void,
}

export const NavIcon = (props: NavIconProps) => {
    return (
        <button
            type="button"
            onClick={() => {
                if (props.handleClick) props.handleClick(props.navName);
            }}
            className={`flex p-2 items-center justify-center rounded-md transition hover:bg-white/10  ${
                props.isActive ?"bg-white/10   " : ""
            }`}
        >
            <FontAwesomeIcon
                icon={props.isActive ? props.activeIcon : props.defaultIcon}
                className="size-6"
            />
        </button>
    );
};
