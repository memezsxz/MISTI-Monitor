"use client";

import {Container} from "@/components/Container";

export const FailureTreePanel = () => {
    return (
        <Container>
            <div className="flex min-h-[28rem] items-center justify-center">
                <svg
                    width="240"
                    height="140"
                    viewBox="0 0 240 140"
                    role="img"
                    aria-label="Failure tree placeholder"
                    className="text-white/60"
                >
                    <rect x="10" y="10" width="220" height="120" rx="12" ry="12" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M40 50 H200" stroke="currentColor" strokeWidth="2" />
                    <path d="M40 80 H200" stroke="currentColor" strokeWidth="2" />
                    <path d="M120 50 V100" stroke="currentColor" strokeWidth="2" />
                    <text x="120" y="115" textAnchor="middle" fontSize="12" fill="currentColor">
                        Failure Tree
                    </text>
                </svg>
            </div>
        </Container>
    );
};
