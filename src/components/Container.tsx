'use client'
import {JSX} from "react";

export const Container = ({children} : {children? : JSX.Element}) => {
    return (
        <>
            <div
                className="rounded-xl w-full p-1 text-sm scheme-dark in-data-stack:rounded-none dark:bg-white/5 dark:inset-ring dark:inset-ring-white/10 in-data-stack:dark:inset-ring-0">
                <div className="relative"></div>
                <div
                    className="*:flex *:*:shrink-0 *:*:grow *:overflow-auto *:rounded-lg *:bg-white/10! *:p-5 dark:*:bg-white/5! **:[.line]:isolate **:[.line]:block **:[.line]:not-last:min-h-[1lh] *:inset-ring *:inset-ring-white/10 dark:*:inset-ring-white/5 *:*:max-w-none">
                        {children}
                </div>
            </div>
            {/*<div className="container bg-zinc-800 rounded-sm shadow-lg shadow-zinc-800/50 inset-shadow-sm /!*inset-shadow-zinc-900*!/ inset-shadow-black/50 botder-10 border-white p-5">*/}
            {/*    {children}*/}
            {/*</div>*/}
        </>
    );
};