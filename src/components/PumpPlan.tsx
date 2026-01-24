"use client";
import React, {useEffect, useRef, useState} from "react";

type TooltipState = {
    open: boolean;
    x: number;
    y: number;
    targetId: string | null;
};

export type TooltipInfo = {
    title: string;
    lines: string[];
};

function findInteractiveId(el: Element | null) {
    while (el) {
        const id = (el as HTMLElement).id;
        if (id && /^(sensor|valve|pump|tank|pipe|connector|l|t)_/.test(id)) return id;
        el = el.parentElement;
    }
    return null;
}

export function PumpPlanView({ onSelectPart }: { onSelectPart?: (id: string, info: TooltipInfo | null) => void }) {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const cacheRef = useRef<{ data: Record<string, TooltipInfo>; ts: number } | null>(null);

    const [infoById, setInfoById] = useState<Record<string, TooltipInfo>>({});
    const [error, setError] = useState<string | null>(null);

    const [hoverId, setHoverId] = useState<string | null>(null);
    const [tip, setTip] = useState<TooltipState>({ open: false, x: 0, y: 0, targetId: null });
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        let active = true;

        const fetchData = async () => {
            const now = Date.now();
            if (cacheRef.current && now - cacheRef.current.ts < 5000) {
                if (active) setInfoById(cacheRef.current.data);
                return;
            }

            try {
                const res = await fetch("/api/pump-plan", { cache: "no-store" });
                if (!res.ok) throw new Error(await res.text());
                const data = (await res.json()) as Record<string, TooltipInfo>;
                if (!active) return;
                cacheRef.current = { data, ts: Date.now() };
                setInfoById(data);
                setError(null);
            } catch {
                if (active) setError("Could not fetch pump plan data.");
            }
        };

        fetchData();
        const intervalId = window.setInterval(fetchData, 5000);

        return () => {
            active = false;
            window.clearInterval(intervalId);
        };
    }, []);

    function onMove(e: React.MouseEvent) {
        if (!wrapRef.current) return;
        const id = findInteractiveId(e.target as Element);
        if (!id) {
            setHoverId(null);
            setTip((t) => ({ ...t, open: false, targetId: null }));
            return;
        }

        const rect = wrapRef.current.getBoundingClientRect();
        setHoverId(id);
        setTip({
            open: true,
            targetId: id,
            x: e.clientX - rect.left + 12,
            y: e.clientY - rect.top + 12,
        });
    }

    function onLeave() {
        setHoverId(null);
        setTip((t) => ({ ...t, open: false, targetId: null }));
    }

    function onClick(e: React.MouseEvent) {
        const id = findInteractiveId(e.target as Element);
        if (!id) return;
        const info = infoById[id as keyof typeof infoById] ?? null;
        onSelectPart?.(id, info);
    }

    const tooltipData = tip.targetId
        ? infoById[tip.targetId as keyof typeof infoById] ?? {
            title: tip.targetId,
            lines: ["No data available"],
        }
        : null;
    useEffect(() => {
        if (!tip.open) {
            setTooltipPos(null);
            return;
        }
        const frame = window.requestAnimationFrame(() => {
            if (!wrapRef.current || !tooltipRef.current) return;
            const wrapRect = wrapRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const padding = 12;
            let x = tip.x;
            let y = tip.y;

            if (x + tooltipRect.width + padding > wrapRect.width) {
                x = Math.max(padding, x - tooltipRect.width - padding);
            }
            if (y + tooltipRect.height + padding > wrapRect.height) {
                y = Math.max(padding, y - tooltipRect.height - padding);
            }

            x = Math.min(Math.max(padding, x), wrapRect.width - tooltipRect.width - padding);
            y = Math.min(Math.max(padding, y), wrapRect.height - tooltipRect.height - padding);

            setTooltipPos({ x, y });
        });

        return () => window.cancelAnimationFrame(frame);
    }, [tip.open, tip.x, tip.y, tip.targetId, tooltipData?.title]);

    return (
        <div ref={wrapRef} className="relative w-full overflow-visible rounded-2xl border border-white/10 bg-zinc-950">
            {error ? (
                <p className="p-3 text-sm text-red-400">{error}</p>
            ) : null}
            <div >
                <svg
                    viewBox="0 0 819 1492"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    onMouseMove={onMove}
                    onMouseLeave={onLeave}
                    onClick={onClick}
                    className="block"
                >
                    <g id="Group 61">
                        <g id="pipe_39">
                            <rect x="190.5" y="1124" width="582" height="25" fill="#4B989E"/>
                            <rect x="190.5" y="1124" width="582" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_38">
                            <rect x="66.5" y="1124" width="51" height="25" fill="#4B989E"/>
                            <rect x="66.5" y="1124" width="51" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_27">
                            <rect x="444.5" y="1287" width="46" height="25" fill="#4B989E"/>
                            <rect x="444.5" y="1287" width="46" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_32">
                            <rect x="649.5" y="1370" width="126" height="25" fill="#4B989E"/>
                            <rect x="649.5" y="1370" width="126" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_31">
                            <rect x="606.5" y="1356" width="28" height="25" transform="rotate(-90 606.5 1356)"
                                  fill="#4B989E"/>
                            <rect x="606.5" y="1356" width="28" height="25" transform="rotate(-90 606.5 1356)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_30">
                            <rect x="606.5" y="1438" width="28" height="25" transform="rotate(-90 606.5 1438)"
                                  fill="#4B989E"/>
                            <rect x="606.5" y="1438" width="28" height="25" transform="rotate(-90 606.5 1438)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_29">
                            <rect x="564.5" y="1287" width="25" height="25" fill="#4B989E"/>
                            <rect x="564.5" y="1287" width="25" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_28">
                            <rect x="564.5" y="1454" width="26" height="25" fill="#4B989E"/>
                            <rect x="564.5" y="1454" width="26" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_26">
                            <rect x="445.5" y="1454" width="46" height="25" fill="#4B989E"/>
                            <rect x="445.5" y="1454" width="46" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_25">
                            <rect x="272.5" y="1287" width="59" height="25" fill="#4B989E"/>
                            <rect x="272.5" y="1287" width="59" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_23">
                            <rect x="184.5" y="1287" width="15" height="25" fill="#4B989E"/>
                            <rect x="184.5" y="1287" width="15" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_19">
                            <rect x="64.5" y="1370" width="62" height="25" fill="#4B989E"/>
                            <rect x="64.5" y="1370" width="62" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_22">
                            <rect x="185.5" y="1454" width="15" height="25" fill="#4B989E"/>
                            <rect x="185.5" y="1454" width="15" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_21">
                            <rect x="144.5" y="1356" width="28" height="25" transform="rotate(-90 144.5 1356)"
                                  fill="#4B989E"/>
                            <rect x="144.5" y="1356" width="28" height="25" transform="rotate(-90 144.5 1356)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_20">
                            <rect x="144.5" y="1440" width="30" height="25" transform="rotate(-90 144.5 1440)"
                                  fill="#4B989E"/>
                            <rect x="144.5" y="1440" width="30" height="25" transform="rotate(-90 144.5 1440)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_24">
                            <rect x="273.5" y="1454" width="59" height="25" fill="#4B989E"/>
                            <rect x="273.5" y="1454" width="59" height="25" stroke="black"/>
                        </g>
                        <g id="l_9">
                            <rect id="Rectangle 17" x="175.5" y="1285" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 20" x="171.5" y="1319" width="9" height="29" rx="1.5"
                                  transform="rotate(90 171.5 1319)" fill="#36767B" stroke="black"/>
                            <path id="Vector 2"
                                  d="M175.268 1288.48C175.352 1288.48 175.43 1288.48 175.5 1288.48V1309.46C175.435 1309.46 175.365 1309.45 175.291 1309.45C174.827 1309.42 174.185 1309.41 173.478 1309.44C172.771 1309.47 171.988 1309.55 171.245 1309.72C170.508 1309.9 169.777 1310.17 169.2 1310.6C168.56 1311.08 168.179 1311.94 167.938 1312.83C167.692 1313.74 167.564 1314.8 167.501 1315.78C167.437 1316.77 167.437 1317.71 167.453 1318.39C167.458 1318.63 167.467 1318.83 167.475 1319H146.939C146.935 1318.96 146.93 1318.93 146.926 1318.89C146.887 1318.54 146.838 1318.02 146.804 1317.36C146.734 1316.06 146.719 1314.21 146.935 1312.05C147.367 1307.73 148.722 1302.2 152.399 1297.3C156.04 1292.45 161.894 1290.23 166.909 1289.24C169.409 1288.75 171.678 1288.56 173.323 1288.5C174.145 1288.47 174.81 1288.47 175.268 1288.48Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="l_11">
                            <rect id="Rectangle 17_2" x="632.5" y="1318" width="9" height="29" rx="1.5"
                                  transform="rotate(90 632.5 1318)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_2" x="598.5" y="1314" width="9" height="29" rx="1.5"
                                  transform="rotate(-180 598.5 1314)" fill="#36767B" stroke="black"/>
                            <path id="Vector 2_2"
                                  d="M629.023 1317.77C629.022 1317.85 629.019 1317.93 629.018 1318H608.04C608.044 1317.94 608.05 1317.87 608.054 1317.79C608.078 1317.33 608.094 1316.69 608.062 1315.98C608.029 1315.27 607.949 1314.49 607.775 1313.75C607.603 1313.01 607.332 1312.28 606.899 1311.7C606.419 1311.06 605.559 1310.68 604.669 1310.44C603.756 1310.19 602.703 1310.06 601.719 1310C600.731 1309.94 599.794 1309.94 599.105 1309.95C598.874 1309.96 598.669 1309.97 598.5 1309.97V1289.44C598.535 1289.44 598.572 1289.43 598.611 1289.43C598.964 1289.39 599.482 1289.34 600.136 1289.3C601.444 1289.23 603.293 1289.22 605.45 1289.43C609.769 1289.87 615.296 1291.22 620.199 1294.9C625.053 1298.54 627.268 1304.39 628.259 1309.41C628.752 1311.91 628.938 1314.18 629 1315.82C629.031 1316.65 629.031 1317.31 629.023 1317.77Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="l_10">
                            <rect id="Rectangle 17_3" x="600.5" y="1481" width="9" height="29" rx="1.5"
                                  transform="rotate(-180 600.5 1481)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_3" x="604.5" y="1447" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 604.5 1447)" fill="#36767B" stroke="black"/>
                            <path id="Vector 2_3"
                                  d="M600.732 1477.52C600.648 1477.52 600.57 1477.52 600.5 1477.52V1456.54C600.565 1456.54 600.635 1456.55 600.709 1456.55C601.173 1456.58 601.815 1456.59 602.522 1456.56C603.229 1456.53 604.012 1456.45 604.755 1456.28C605.492 1456.1 606.223 1455.83 606.8 1455.4C607.44 1454.92 607.821 1454.06 608.062 1453.17C608.308 1452.26 608.436 1451.2 608.499 1450.22C608.563 1449.23 608.563 1448.29 608.547 1447.61C608.542 1447.37 608.533 1447.17 608.525 1447H629.061C629.065 1447.04 629.07 1447.07 629.074 1447.11C629.113 1447.46 629.162 1447.98 629.196 1448.64C629.266 1449.94 629.281 1451.79 629.065 1453.95C628.633 1458.27 627.278 1463.8 623.601 1468.7C619.96 1473.55 614.106 1475.77 609.091 1476.76C606.591 1477.25 604.322 1477.44 602.677 1477.5C601.855 1477.53 601.19 1477.53 600.732 1477.52Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="l_13">
                            <rect id="Rectangle 17_4" x="784.5" y="1396" width="9" height="29" rx="1.5"
                                  transform="rotate(-180 784.5 1396)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_4" x="788.5" y="1362" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 788.5 1362)" fill="#36767B" stroke="black"/>
                            <path id="Vector 2_4"
                                  d="M784.732 1392.52C784.648 1392.52 784.57 1392.52 784.5 1392.52V1371.54C784.565 1371.54 784.635 1371.55 784.709 1371.55C785.173 1371.58 785.815 1371.59 786.522 1371.56C787.229 1371.53 788.012 1371.45 788.755 1371.28C789.492 1371.1 790.223 1370.83 790.8 1370.4C791.44 1369.92 791.821 1369.06 792.062 1368.17C792.308 1367.26 792.436 1366.2 792.499 1365.22C792.563 1364.23 792.563 1363.29 792.547 1362.61C792.542 1362.37 792.533 1362.17 792.525 1362H813.061C813.065 1362.04 813.07 1362.07 813.074 1362.11C813.113 1362.46 813.162 1362.98 813.196 1363.64C813.266 1364.94 813.281 1366.79 813.065 1368.95C812.633 1373.27 811.278 1378.8 807.601 1383.7C803.96 1388.55 798.106 1390.77 793.091 1391.76C790.591 1392.25 788.322 1392.44 786.677 1392.5C785.855 1392.53 785.19 1392.53 784.732 1392.52Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="l_6">
                            <rect id="Rectangle 17_5" x="21.5" y="1364" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 1364)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_5" x="55.5" y="1368" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <path id="Vector 2_5"
                                  d="M24.9766 1364.23C24.978 1364.15 24.9806 1364.07 24.9824 1364H45.96C45.9559 1364.06 45.9501 1364.13 45.9463 1364.21C45.9223 1364.67 45.9063 1365.31 45.9385 1366.02C45.9706 1366.73 46.0513 1367.51 46.2246 1368.25C46.3968 1368.99 46.6679 1369.72 47.1006 1370.3C47.5809 1370.94 48.4409 1371.32 49.3311 1371.56C50.2438 1371.81 51.2971 1371.94 52.2812 1372C53.2687 1372.06 54.2057 1372.06 54.8945 1372.05C55.1264 1372.04 55.3308 1372.03 55.5 1372.03V1392.56C55.4649 1392.56 55.4279 1392.57 55.3887 1392.57C55.036 1392.61 54.5179 1392.66 53.8643 1392.7C52.5565 1392.77 50.7072 1392.78 48.5498 1392.57C44.2305 1392.13 38.7037 1390.78 33.8008 1387.1C28.9465 1383.46 26.7319 1377.61 25.7412 1372.59C25.2475 1370.09 25.0618 1367.82 25 1366.18C24.9691 1365.35 24.9689 1364.69 24.9766 1364.23Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="l_8">
                            <rect id="Rectangle 17_6" x="142.5" y="1449" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 142.5 1449)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_6" x="176.5" y="1453" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <path id="Vector 2_6"
                                  d="M145.977 1449.23C145.978 1449.15 145.981 1449.07 145.982 1449H166.96C166.956 1449.06 166.95 1449.13 166.946 1449.21C166.922 1449.67 166.906 1450.31 166.938 1451.02C166.971 1451.73 167.051 1452.51 167.225 1453.25C167.397 1453.99 167.668 1454.72 168.101 1455.3C168.581 1455.94 169.441 1456.32 170.331 1456.56C171.244 1456.81 172.297 1456.94 173.281 1457C174.269 1457.06 175.206 1457.06 175.895 1457.05C176.126 1457.04 176.331 1457.03 176.5 1457.03V1477.56C176.465 1477.56 176.428 1477.57 176.389 1477.57C176.036 1477.61 175.518 1477.66 174.864 1477.7C173.556 1477.77 171.707 1477.78 169.55 1477.57C165.231 1477.13 159.704 1475.78 154.801 1472.1C149.947 1468.46 147.732 1462.61 146.741 1457.59C146.248 1455.09 146.062 1452.82 146 1451.18C145.969 1450.35 145.969 1449.69 145.977 1449.23Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="pipe_6">
                            <rect x="326.5" y="23" width="446" height="25" fill="#4B989E"/>
                            <rect x="326.5" y="23" width="446" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_5">
                            <rect x="788.5" y="89" width="26" height="25" transform="rotate(-90 788.5 89)"
                                  fill="#4B989E"/>
                            <rect x="788.5" y="89" width="26" height="25" transform="rotate(-90 788.5 89)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_4">
                            <rect x="788.5" y="187.5" width="25.5" height="25" transform="rotate(-90 788.5 187.5)"
                                  fill="#4B989E"/>
                            <rect x="788.5" y="187.5" width="25.5" height="25" transform="rotate(-90 788.5 187.5)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_3">
                            <rect x="788.5" y="407" width="166" height="25" transform="rotate(-90 788.5 407)"
                                  fill="#4B989E"/>
                            <rect x="788.5" y="407" width="166" height="25" transform="rotate(-90 788.5 407)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_2">
                            <rect x="788.5" y="546" width="66" height="25" transform="rotate(-90 788.5 546)"
                                  fill="#4B989E"/>
                            <rect x="788.5" y="546" width="66" height="25" transform="rotate(-90 788.5 546)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_1">
                            <rect x="788.5" y="700" width="81" height="25" transform="rotate(-90 788.5 700)"
                                  fill="#4B989E"/>
                            <rect x="788.5" y="700" width="81" height="25" transform="rotate(-90 788.5 700)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_35">
                            <rect x="790.5" y="1111" width="321" height="25" transform="rotate(-90 790.5 1111)"
                                  fill="#4B989E"/>
                            <rect x="790.5" y="1111" width="321" height="25" transform="rotate(-90 790.5 1111)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_34">
                            <rect x="790.5" y="1219" width="55" height="25" transform="rotate(-90 790.5 1219)"
                                  fill="#4B989E"/>
                            <rect x="790.5" y="1219" width="55" height="25" transform="rotate(-90 790.5 1219)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_33">
                            <rect x="790.5" y="1353" width="62" height="25" transform="rotate(-90 790.5 1353)"
                                  fill="#4B989E"/>
                            <rect x="790.5" y="1353" width="62" height="25" transform="rotate(-90 790.5 1353)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_18">
                            <rect x="23.5" y="1355" width="65" height="25" transform="rotate(-90 23.5 1355)"
                                  fill="#4B989E"/>
                            <rect x="23.5" y="1355" width="65" height="25" transform="rotate(-90 23.5 1355)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_17">
                            <rect x="23.5" y="1217" width="54" height="25" transform="rotate(-90 23.5 1217)"
                                  fill="#4B989E"/>
                            <rect x="23.5" y="1217" width="54" height="25" transform="rotate(-90 23.5 1217)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_16">
                            <rect x="23.5" y="1110" width="162" height="25" transform="rotate(-90 23.5 1110)"
                                  fill="#4B989E"/>
                            <rect x="23.5" y="1110" width="162" height="25" transform="rotate(-90 23.5 1110)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_15">
                            <rect x="23.5" y="875" width="40" height="25" transform="rotate(-90 23.5 875)"
                                  fill="#4B989E"/>
                            <rect x="23.5" y="875" width="40" height="25" transform="rotate(-90 23.5 875)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_14">
                            <rect x="23.5" y="762" width="163" height="25" transform="rotate(-90 23.5 762)"
                                  fill="#4B989E"/>
                            <rect x="23.5" y="762" width="163" height="25" transform="rotate(-90 23.5 762)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_13">
                            <rect x="23.5" y="526" width="39" height="25" transform="rotate(-90 23.5 526)"
                                  fill="#4B989E"/>
                            <rect x="23.5" y="526" width="39" height="25" transform="rotate(-90 23.5 526)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_12">
                            <rect x="23.5" y="414" width="75" height="25" transform="rotate(-90 23.5 414)"
                                  fill="#4B989E"/>
                            <rect x="23.5" y="414" width="75" height="25" transform="rotate(-90 23.5 414)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_7">
                            <rect x="188.5" y="24" width="66" height="25" fill="#4B989E"/>
                            <rect x="188.5" y="24" width="66" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_8">
                            <rect x="61.5" y="24" width="54" height="25" fill="#4B989E"/>
                            <rect x="61.5" y="24" width="54" height="25" stroke="black"/>
                        </g>
                        <g id="sensor_5">
                            <rect id="Rectangle 5" x="23.5" y="478" width="13" height="25"
                                  transform="rotate(-90 23.5 478)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19" x="23.5" y="436" width="13" height="25"
                                  transform="rotate(-90 23.5 436)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 9" x="18.5" y="455.5" width="10" height="3"
                                  transform="rotate(-90 18.5 455.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 6" x="21.5" y="487" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 487)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 7" x="21.5" y="423" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 423)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 8" x="21.5" y="465" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 465)" fill="#4B989E" stroke="black"/>
                            <circle id="Ellipse 1" cx="10" cy="450.5" r="9.5" transform="rotate(-90 10 450.5)"
                                    fill="#DFDFDF" stroke="black"/>
                            <circle id="Ellipse 3" cx="10" cy="450.5" r="0.5" transform="rotate(-90 10 450.5)"
                                    stroke="#C69F6E"/>
                            <path id="Ellipse 2"
                                  d="M15.3033 455.803C14.2544 456.852 12.918 457.567 11.4632 457.856C10.0083 458.145 8.50032 457.997 7.12987 457.429C5.75943 456.861 4.58809 455.9 3.76398 454.667C2.93987 453.433 2.5 451.983 2.5 450.5C2.5 449.017 2.93987 447.567 3.76398 446.333C4.58809 445.1 5.75943 444.139 7.12987 443.571C8.50032 443.003 10.0083 442.855 11.4632 443.144C12.918 443.433 14.2544 444.148 15.3033 445.197"
                                  stroke="#C69F6E" stroke-linecap="round"/>
                            <line id="Line 1" x1="5.5" y1="450.5" x2="9.5" y2="450.5" stroke="#C69F6E"
                                  stroke-linecap="round"/>
                            <g id="circum:temp-high">
                                <path id="Vector"
                                      d="M37.05 448.353H30.7042C30.1342 448.357 29.5883 448.583 29.1817 448.983C28.9654 449.201 28.7984 449.464 28.6923 449.752C28.5862 450.041 28.5434 450.349 28.5667 450.655C28.6214 451.21 28.8836 451.724 29.3007 452.094C29.7179 452.464 30.2593 452.662 30.8167 452.65L37.0267 452.643C37.4392 453.192 38.0014 453.61 38.6459 453.848C39.2903 454.085 39.9896 454.131 40.6597 453.981C41.3298 453.83 41.9422 453.489 42.4233 452.999C42.9044 452.509 43.2337 451.891 43.3717 451.218C43.4169 450.983 43.4395 450.744 43.4392 450.505C43.4392 449.56 43.0641 448.653 42.3963 447.984C41.7284 447.314 40.8223 446.937 39.8767 446.935C39.3275 446.934 38.7856 447.061 38.2947 447.308C37.8037 447.554 37.3774 447.912 37.05 448.353ZM42.045 448.713C42.3118 449.038 42.5027 449.419 42.6039 449.828C42.7051 450.237 42.714 450.663 42.63 451.075C42.521 451.623 42.2493 452.125 41.8506 452.515C41.4519 452.906 40.9446 453.167 40.395 453.265C39.8796 453.362 39.3473 453.313 38.8582 453.124C38.3692 452.934 37.9429 452.612 37.6275 452.193C37.5607 452.102 37.4737 452.029 37.3735 451.978C37.2732 451.927 37.1624 451.901 37.05 451.9H30.8167C30.4503 451.909 30.0939 451.78 29.8167 451.541C29.5395 451.301 29.3613 450.967 29.3167 450.603C29.3107 450.568 29.3082 450.533 29.3092 450.498C29.3131 450.129 29.4614 449.776 29.7221 449.516C29.9829 449.255 30.3355 449.107 30.7042 449.103H37.05C37.1624 449.102 37.2732 449.076 37.3735 449.025C37.4737 448.974 37.5607 448.901 37.6275 448.81C37.8826 448.469 38.2119 448.191 38.5904 447.996C38.969 447.801 39.3869 447.695 39.8125 447.686C40.2381 447.677 40.6603 447.764 41.0471 447.942C41.4339 448.12 41.7751 448.383 42.045 448.713Z"
                                      fill="black"/>
                                <path id="Vector_2"
                                      d="M39.8766 449.08C40.2525 449.08 40.613 449.23 40.8789 449.495C41.1447 449.761 41.2941 450.122 41.2941 450.498C41.2941 450.874 41.1447 451.234 40.8789 451.5C40.613 451.766 40.2525 451.915 39.8766 451.915C39.5666 451.917 39.2649 451.815 39.0191 451.627C38.7733 451.438 38.5974 451.173 38.5191 450.873H31.0498C30.9503 450.873 30.855 450.833 30.7846 450.763C30.7143 450.693 30.6748 450.597 30.6748 450.498C30.6748 450.398 30.7143 450.303 30.7846 450.233C30.855 450.162 30.9503 450.123 31.0498 450.123H38.5198C38.5992 449.824 38.7754 449.559 39.0208 449.371C39.2662 449.182 39.5671 449.08 39.8766 449.08Z"
                                      fill="black"/>
                            </g>
                        </g>
                        <g id="sensor_2">
                            <rect id="Rectangle 5_2" x="788.5" y="471" width="13" height="25"
                                  transform="rotate(-90 788.5 471)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19_2" x="788.5" y="429" width="13" height="25"
                                  transform="rotate(-90 788.5 429)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 9_2" x="783.5" y="448.5" width="10" height="3"
                                  transform="rotate(-90 783.5 448.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 6_2" x="786.5" y="480" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 480)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 7_2" x="786.5" y="416" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 416)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 8_2" x="786.5" y="458" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 458)" fill="#4B989E" stroke="black"/>
                            <circle id="Ellipse 1_2" cx="775" cy="443.5" r="9.5" transform="rotate(-90 775 443.5)"
                                    fill="#DFDFDF" stroke="black"/>
                            <circle id="Ellipse 3_2" cx="775" cy="443.5" r="0.5" transform="rotate(-90 775 443.5)"
                                    stroke="#C69F6E"/>
                            <path id="Ellipse 2_2"
                                  d="M780.303 448.803C779.254 449.852 777.918 450.567 776.463 450.856C775.008 451.145 773.5 450.997 772.13 450.429C770.759 449.861 769.588 448.9 768.764 447.667C767.94 446.433 767.5 444.983 767.5 443.5C767.5 442.017 767.94 440.567 768.764 439.333C769.588 438.1 770.759 437.139 772.13 436.571C773.5 436.003 775.008 435.855 776.463 436.144C777.918 436.433 779.254 437.148 780.303 438.197"
                                  stroke="#C69F6E" stroke-linecap="round"/>
                            <line id="Line 1_2" x1="770.5" y1="443.5" x2="774.5" y2="443.5" stroke="#C69F6E"
                                  stroke-linecap="round"/>
                            <g id="circum:temp-high_2">
                                <path id="Vector_3"
                                      d="M802.05 441.353H795.704C795.134 441.357 794.588 441.583 794.182 441.983C793.965 442.201 793.798 442.464 793.692 442.752C793.586 443.041 793.543 443.349 793.567 443.655C793.621 444.21 793.884 444.724 794.301 445.094C794.718 445.464 795.259 445.662 795.817 445.65L802.027 445.643C802.439 446.192 803.001 446.61 803.646 446.848C804.29 447.085 804.99 447.131 805.66 446.981C806.33 446.83 806.942 446.489 807.423 445.999C807.904 445.509 808.234 444.891 808.372 444.218C808.417 443.983 808.44 443.744 808.439 443.505C808.439 442.56 808.064 441.653 807.396 440.984C806.728 440.314 805.822 439.937 804.877 439.935C804.328 439.934 803.786 440.061 803.295 440.308C802.804 440.554 802.377 440.912 802.05 441.353ZM807.045 441.713C807.312 442.038 807.503 442.419 807.604 442.828C807.705 443.237 807.714 443.663 807.63 444.075C807.521 444.623 807.249 445.125 806.851 445.515C806.452 445.906 805.945 446.167 805.395 446.265C804.88 446.362 804.347 446.313 803.858 446.124C803.369 445.934 802.943 445.612 802.627 445.193C802.561 445.102 802.474 445.029 802.373 444.978C802.273 444.927 802.162 444.901 802.05 444.9H795.817C795.45 444.909 795.094 444.78 794.817 444.541C794.539 444.301 794.361 443.967 794.317 443.603C794.311 443.568 794.308 443.533 794.309 443.498C794.313 443.129 794.461 442.776 794.722 442.516C794.983 442.255 795.335 442.107 795.704 442.103H802.05C802.162 442.102 802.273 442.076 802.373 442.025C802.474 441.974 802.561 441.901 802.627 441.81C802.883 441.469 803.212 441.191 803.59 440.996C803.969 440.801 804.387 440.695 804.813 440.686C805.238 440.677 805.66 440.764 806.047 440.942C806.434 441.12 806.775 441.383 807.045 441.713Z"
                                      fill="black"/>
                                <path id="Vector_4"
                                      d="M804.877 442.08C805.252 442.08 805.613 442.23 805.879 442.495C806.145 442.761 806.294 443.122 806.294 443.498C806.294 443.874 806.145 444.234 805.879 444.5C805.613 444.766 805.252 444.915 804.877 444.915C804.567 444.917 804.265 444.815 804.019 444.627C803.773 444.438 803.597 444.173 803.519 443.873H796.05C795.95 443.873 795.855 443.833 795.785 443.763C795.714 443.693 795.675 443.597 795.675 443.498C795.675 443.398 795.714 443.303 795.785 443.233C795.855 443.162 795.95 443.123 796.05 443.123H803.52C803.599 442.824 803.775 442.559 804.021 442.371C804.266 442.182 804.567 442.08 804.877 442.08Z"
                                      fill="black"/>
                            </g>
                        </g>
                        <g id="sensor_1">
                            <rect id="Rectangle 5_3" x="788.5" y="610" width="13" height="25"
                                  transform="rotate(-90 788.5 610)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19_3" x="788.5" y="568" width="13" height="25"
                                  transform="rotate(-90 788.5 568)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 9_3" x="783.5" y="587.5" width="10" height="3"
                                  transform="rotate(-90 783.5 587.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 6_3" x="786.5" y="619" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 619)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 7_3" x="786.5" y="555" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 555)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 8_3" x="786.5" y="597" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 597)" fill="#4B989E" stroke="black"/>
                            <g id="Vector_5">
                                <path
                                    d="M800.831 587.25C800.831 586.447 800.58 585.644 800.118 584.925C800.049 584.818 800.049 584.681 800.117 584.574C801.03 583.136 801.03 581.363 800.117 579.925C800.049 579.818 800.049 579.681 800.118 579.575C800.58 578.856 800.831 578.053 800.831 577.25V576.3C800.831 576.134 800.966 576 801.131 576H801.781C801.947 576 802.081 576.134 802.081 576.3V577.25C802.081 578.056 801.887 578.862 801.526 579.611C801.483 579.698 801.484 579.801 801.526 579.889C802.246 581.376 802.246 583.124 801.526 584.611C801.484 584.699 801.483 584.801 801.526 584.889C801.887 585.637 802.081 586.438 802.081 587.25V588.2C802.081 588.365 801.947 588.5 801.781 588.5H801.131C800.966 588.5 800.831 588.365 800.831 588.2V587.25ZM803.868 584.925C803.799 584.818 803.799 584.681 803.867 584.574C804.78 583.136 804.78 581.363 803.867 579.925C803.799 579.818 803.799 579.681 803.868 579.575C804.33 578.856 804.581 578.053 804.581 577.25V576.3C804.581 576.134 804.716 576 804.881 576H805.531C805.697 576 805.831 576.134 805.831 576.3V577.25C805.831 578.056 805.637 578.862 805.276 579.611C805.233 579.698 805.234 579.801 805.276 579.889C805.996 581.376 805.996 583.124 805.276 584.611C805.234 584.699 805.233 584.801 805.276 584.889C805.637 585.637 805.831 586.438 805.831 587.25V588.2C805.831 588.365 805.697 588.5 805.531 588.5H804.881C804.716 588.5 804.581 588.365 804.581 588.2V587.25C804.581 586.447 804.33 585.644 803.868 584.925Z"
                                    fill="black"/>
                                <path
                                    d="M796.117 584.575C796.049 584.681 796.049 584.818 796.118 584.925C796.58 585.644 796.831 586.447 796.831 587.25V588.2C796.831 588.366 796.966 588.5 797.131 588.5H797.781C797.947 588.5 798.081 588.366 798.081 588.2V587.25C798.081 586.438 797.887 585.637 797.526 584.889C797.483 584.801 797.484 584.699 797.526 584.611C798.246 583.124 798.246 581.376 797.526 579.889C797.484 579.801 797.483 579.699 797.526 579.611C797.887 578.862 798.081 578.056 798.081 577.25V576.3C798.081 576.134 797.947 576 797.781 576H797.131C796.966 576 796.831 576.134 796.831 576.3V577.25C796.831 578.053 796.58 578.856 796.118 579.575C796.049 579.682 796.049 579.819 796.117 579.925C797.03 581.363 797.03 583.137 796.117 584.575Z"
                                    fill="black"/>
                            </g>
                            <circle id="Ellipse 1_3" cx="775" cy="582.5" r="9.5" transform="rotate(-90 775 582.5)"
                                    fill="#DFDFDF" stroke="black"/>
                            <circle id="Ellipse 3_3" cx="775" cy="582.5" r="0.5" transform="rotate(-90 775 582.5)"
                                    stroke="#C69F6E"/>
                            <path id="Ellipse 2_3"
                                  d="M780.303 587.803C779.254 588.852 777.918 589.567 776.463 589.856C775.008 590.145 773.5 589.997 772.13 589.429C770.759 588.861 769.588 587.9 768.764 586.667C767.94 585.433 767.5 583.983 767.5 582.5C767.5 581.017 767.94 579.567 768.764 578.333C769.588 577.1 770.759 576.139 772.13 575.571C773.5 575.003 775.008 574.855 776.463 575.144C777.918 575.433 779.254 576.148 780.303 577.197"
                                  stroke="#C69F6E" stroke-linecap="round"/>
                            <line id="Line 1_3" x1="770.5" y1="582.5" x2="774.5" y2="582.5" stroke="#C69F6E"
                                  stroke-linecap="round"/>
                        </g>
                        <g id="sensor_6">
                            <rect id="Rectangle 5_4" x="23.5" y="590" width="13" height="25"
                                  transform="rotate(-90 23.5 590)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19_4" x="23.5" y="548" width="13" height="25"
                                  transform="rotate(-90 23.5 548)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 9_4" x="18.5" y="567.5" width="10" height="3"
                                  transform="rotate(-90 18.5 567.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 6_4" x="21.5" y="599" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 599)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 7_4" x="21.5" y="535" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 535)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 8_4" x="21.5" y="577" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 577)" fill="#4B989E" stroke="black"/>
                            <g id="Vector_6">
                                <path
                                    d="M35.8313 567.25C35.8313 566.447 35.5803 565.644 35.1178 564.925C35.0494 564.818 35.0493 564.681 35.1171 564.574C36.0297 563.136 36.0297 561.363 35.1171 559.925C35.0493 559.818 35.0494 559.681 35.1178 559.575C35.5803 558.856 35.8313 558.053 35.8313 557.25V556.3C35.8313 556.134 35.9656 556 36.1313 556H36.7813C36.9469 556 37.0813 556.134 37.0813 556.3V557.25C37.0813 558.056 36.8874 558.862 36.5257 559.611C36.4833 559.698 36.4835 559.801 36.526 559.889C37.2455 561.376 37.2455 563.124 36.526 564.611C36.4835 564.699 36.4833 564.801 36.5257 564.889C36.8874 565.637 37.0813 566.438 37.0813 567.25V568.2C37.0813 568.365 36.9469 568.5 36.7813 568.5H36.1313C35.9656 568.5 35.8313 568.365 35.8313 568.2V567.25ZM38.8678 564.925C38.7994 564.818 38.7993 564.681 38.8671 564.574C39.7797 563.136 39.7797 561.363 38.8671 559.925C38.7993 559.818 38.7994 559.681 38.8678 559.575C39.3303 558.856 39.5813 558.053 39.5813 557.25V556.3C39.5813 556.134 39.7156 556 39.8813 556H40.5313C40.6969 556 40.8313 556.134 40.8313 556.3V557.25C40.8313 558.056 40.6374 558.862 40.2757 559.611C40.2333 559.698 40.2335 559.801 40.276 559.889C40.9955 561.376 40.9955 563.124 40.276 564.611C40.2335 564.699 40.2333 564.801 40.2757 564.889C40.6374 565.637 40.8313 566.438 40.8313 567.25V568.2C40.8313 568.365 40.6969 568.5 40.5313 568.5H39.8813C39.7156 568.5 39.5813 568.365 39.5813 568.2V567.25C39.5813 566.447 39.3303 565.644 38.8678 564.925Z"
                                    fill="black"/>
                                <path
                                    d="M31.1171 564.575C31.0493 564.681 31.0494 564.818 31.1178 564.925C31.5803 565.644 31.8313 566.447 31.8313 567.25V568.2C31.8313 568.366 31.9656 568.5 32.1313 568.5H32.7813C32.9469 568.5 33.0813 568.366 33.0813 568.2V567.25C33.0813 566.438 32.8874 565.637 32.5257 564.889C32.4833 564.801 32.4835 564.699 32.5259 564.611C33.2455 563.124 33.2455 561.376 32.5259 559.889C32.4835 559.801 32.4833 559.699 32.5257 559.611C32.8874 558.862 33.0813 558.056 33.0813 557.25V556.3C33.0813 556.134 32.9469 556 32.7813 556H32.1313C31.9656 556 31.8313 556.134 31.8313 556.3V557.25C31.8313 558.053 31.5803 558.856 31.1178 559.575C31.0494 559.682 31.0493 559.819 31.1171 559.925C32.0297 561.363 32.0297 563.137 31.1171 564.575Z"
                                    fill="black"/>
                            </g>
                            <circle id="Ellipse 1_4" cx="10" cy="562.5" r="9.5" transform="rotate(-90 10 562.5)"
                                    fill="#DFDFDF" stroke="black"/>
                            <circle id="Ellipse 3_4" cx="10" cy="562.5" r="0.5" transform="rotate(-90 10 562.5)"
                                    stroke="#C69F6E"/>
                            <path id="Ellipse 2_4"
                                  d="M15.3033 567.803C14.2544 568.852 12.918 569.567 11.4632 569.856C10.0083 570.145 8.50032 569.997 7.12987 569.429C5.75943 568.861 4.58809 567.9 3.76398 566.667C2.93987 565.433 2.5 563.983 2.5 562.5C2.5 561.017 2.93987 559.567 3.76398 558.333C4.58809 557.1 5.75943 556.139 7.12987 555.571C8.50032 555.003 10.0083 554.855 11.4632 555.144C12.918 555.433 14.2544 556.148 15.3033 557.197"
                                  stroke="#C69F6E" stroke-linecap="round"/>
                            <line id="Line 1_4" x1="5.5" y1="562.5" x2="9.5" y2="562.5" stroke="#C69F6E"
                                  stroke-linecap="round"/>
                        </g>
                        <g id="sensor_7">
                            <rect id="Rectangle 5_5" x="23.5" y="826" width="13" height="25"
                                  transform="rotate(-90 23.5 826)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19_5" x="23.5" y="784" width="13" height="25"
                                  transform="rotate(-90 23.5 784)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 9_5" x="18.5" y="803.5" width="10" height="3"
                                  transform="rotate(-90 18.5 803.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 6_5" x="21.5" y="835" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 835)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 7_5" x="21.5" y="771" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 771)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 8_5" x="21.5" y="813" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 813)" fill="#4B989E" stroke="black"/>
                            <circle id="Ellipse 1_5" cx="10" cy="798.5" r="9.5" transform="rotate(-90 10 798.5)"
                                    fill="#DFDFDF" stroke="black"/>
                            <circle id="Ellipse 3_5" cx="10" cy="798.5" r="0.5" transform="rotate(-90 10 798.5)"
                                    stroke="#C69F6E"/>
                            <path id="Ellipse 2_5"
                                  d="M15.3033 803.803C14.2544 804.852 12.918 805.567 11.4632 805.856C10.0083 806.145 8.50032 805.997 7.12987 805.429C5.75943 804.861 4.58809 803.9 3.76398 802.667C2.93987 801.433 2.5 799.983 2.5 798.5C2.5 797.017 2.93987 795.567 3.76398 794.333C4.58809 793.1 5.75943 792.139 7.12987 791.571C8.50032 791.003 10.0083 790.855 11.4632 791.144C12.918 791.433 14.2544 792.148 15.3033 793.197"
                                  stroke="#C69F6E" stroke-linecap="round"/>
                            <line id="Line 1_5" x1="5.5" y1="798.5" x2="9.5" y2="798.5" stroke="#C69F6E"
                                  stroke-linecap="round"/>
                            <g id="circum:temp-high_3">
                                <path id="Vector_7"
                                      d="M37.05 796.353H30.7042C30.1342 796.357 29.5883 796.583 29.1817 796.983C28.9654 797.201 28.7984 797.464 28.6923 797.752C28.5862 798.041 28.5434 798.349 28.5667 798.655C28.6214 799.21 28.8836 799.724 29.3007 800.094C29.7179 800.464 30.2593 800.662 30.8167 800.65L37.0267 800.643C37.4392 801.192 38.0014 801.61 38.6459 801.848C39.2903 802.085 39.9896 802.131 40.6597 801.981C41.3298 801.83 41.9422 801.489 42.4233 800.999C42.9044 800.509 43.2337 799.891 43.3717 799.218C43.4169 798.983 43.4395 798.744 43.4392 798.505C43.4392 797.56 43.0641 796.653 42.3963 795.984C41.7284 795.314 40.8223 794.937 39.8767 794.935C39.3275 794.934 38.7856 795.061 38.2947 795.308C37.8037 795.554 37.3774 795.912 37.05 796.353ZM42.045 796.713C42.3118 797.038 42.5027 797.419 42.6039 797.828C42.7051 798.237 42.714 798.663 42.63 799.075C42.521 799.623 42.2493 800.125 41.8506 800.515C41.4519 800.906 40.9446 801.167 40.395 801.265C39.8796 801.362 39.3473 801.313 38.8582 801.124C38.3692 800.934 37.9429 800.612 37.6275 800.193C37.5607 800.102 37.4737 800.029 37.3735 799.978C37.2732 799.927 37.1624 799.901 37.05 799.9H30.8167C30.4503 799.909 30.0939 799.78 29.8167 799.541C29.5395 799.301 29.3613 798.967 29.3167 798.603C29.3107 798.568 29.3082 798.533 29.3092 798.498C29.3131 798.129 29.4614 797.776 29.7221 797.516C29.9829 797.255 30.3355 797.107 30.7042 797.103H37.05C37.1624 797.102 37.2732 797.076 37.3735 797.025C37.4737 796.974 37.5607 796.901 37.6275 796.81C37.8826 796.469 38.2119 796.191 38.5904 795.996C38.969 795.801 39.3869 795.695 39.8125 795.686C40.2381 795.677 40.6603 795.764 41.0471 795.942C41.4339 796.12 41.7751 796.383 42.045 796.713Z"
                                      fill="black"/>
                                <path id="Vector_8"
                                      d="M39.8766 797.08C40.2525 797.08 40.613 797.23 40.8789 797.495C41.1447 797.761 41.2941 798.122 41.2941 798.498C41.2941 798.874 41.1447 799.234 40.8789 799.5C40.613 799.766 40.2525 799.915 39.8766 799.915C39.5666 799.917 39.2649 799.815 39.0191 799.627C38.7733 799.438 38.5974 799.173 38.5191 798.873H31.0498C30.9503 798.873 30.855 798.833 30.7846 798.763C30.7143 798.693 30.6748 798.597 30.6748 798.498C30.6748 798.398 30.7143 798.303 30.7846 798.233C30.855 798.162 30.9503 798.123 31.0498 798.123H38.5198C38.5992 797.824 38.7754 797.559 39.0208 797.371C39.2662 797.182 39.5671 797.08 39.8766 797.08Z"
                                      fill="black"/>
                            </g>
                        </g>
                        <g id="sensor_8">
                            <rect id="Rectangle 5_6" x="23.5" y="939" width="13" height="25"
                                  transform="rotate(-90 23.5 939)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19_6" x="23.5" y="897" width="13" height="25"
                                  transform="rotate(-90 23.5 897)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 9_6" x="18.5" y="916.5" width="10" height="3"
                                  transform="rotate(-90 18.5 916.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 6_6" x="21.5" y="948" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 948)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 7_6" x="21.5" y="884" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 884)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 8_6" x="21.5" y="926" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 926)" fill="#4B989E" stroke="black"/>
                            <g id="Vector_9">
                                <path
                                    d="M35.8313 916.25C35.8313 915.447 35.5803 914.644 35.1178 913.925C35.0494 913.818 35.0493 913.681 35.1171 913.574C36.0297 912.136 36.0297 910.363 35.1171 908.925C35.0493 908.818 35.0494 908.681 35.1178 908.575C35.5803 907.856 35.8313 907.053 35.8313 906.25V905.3C35.8313 905.134 35.9656 905 36.1313 905H36.7813C36.9469 905 37.0813 905.134 37.0813 905.3V906.25C37.0813 907.056 36.8874 907.862 36.5257 908.611C36.4833 908.698 36.4835 908.801 36.526 908.889C37.2455 910.376 37.2455 912.124 36.526 913.611C36.4835 913.699 36.4833 913.801 36.5257 913.889C36.8874 914.637 37.0813 915.438 37.0813 916.25V917.2C37.0813 917.365 36.9469 917.5 36.7813 917.5H36.1313C35.9656 917.5 35.8313 917.365 35.8313 917.2V916.25ZM38.8678 913.925C38.7994 913.818 38.7993 913.681 38.8671 913.574C39.7797 912.136 39.7797 910.363 38.8671 908.925C38.7993 908.818 38.7994 908.681 38.8678 908.575C39.3303 907.856 39.5813 907.053 39.5813 906.25V905.3C39.5813 905.134 39.7156 905 39.8813 905H40.5313C40.6969 905 40.8313 905.134 40.8313 905.3V906.25C40.8313 907.056 40.6374 907.862 40.2757 908.611C40.2333 908.698 40.2335 908.801 40.276 908.889C40.9955 910.376 40.9955 912.124 40.276 913.611C40.2335 913.699 40.2333 913.801 40.2757 913.889C40.6374 914.637 40.8313 915.438 40.8313 916.25V917.2C40.8313 917.365 40.6969 917.5 40.5313 917.5H39.8813C39.7156 917.5 39.5813 917.365 39.5813 917.2V916.25C39.5813 915.447 39.3303 914.644 38.8678 913.925Z"
                                    fill="black"/>
                                <path
                                    d="M31.1171 913.575C31.0493 913.681 31.0494 913.818 31.1178 913.925C31.5803 914.644 31.8313 915.447 31.8313 916.25V917.2C31.8313 917.366 31.9656 917.5 32.1313 917.5H32.7813C32.9469 917.5 33.0813 917.366 33.0813 917.2V916.25C33.0813 915.438 32.8874 914.637 32.5257 913.889C32.4833 913.801 32.4835 913.699 32.5259 913.611C33.2455 912.124 33.2455 910.376 32.5259 908.889C32.4835 908.801 32.4833 908.699 32.5257 908.611C32.8874 907.862 33.0813 907.056 33.0813 906.25V905.3C33.0813 905.134 32.9469 905 32.7813 905H32.1313C31.9656 905 31.8313 905.134 31.8313 905.3V906.25C31.8313 907.053 31.5803 907.856 31.1178 908.575C31.0494 908.682 31.0493 908.819 31.1171 908.925C32.0297 910.363 32.0297 912.137 31.1171 913.575Z"
                                    fill="black"/>
                            </g>
                            <circle id="Ellipse 1_6" cx="10" cy="911.5" r="9.5" transform="rotate(-90 10 911.5)"
                                    fill="#DFDFDF" stroke="black"/>
                            <circle id="Ellipse 3_6" cx="10" cy="911.5" r="0.5" transform="rotate(-90 10 911.5)"
                                    stroke="#C69F6E"/>
                            <path id="Ellipse 2_6"
                                  d="M15.3033 916.803C14.2544 917.852 12.918 918.567 11.4632 918.856C10.0083 919.145 8.50032 918.997 7.12987 918.429C5.75943 917.861 4.58809 916.9 3.76398 915.667C2.93987 914.433 2.5 912.983 2.5 911.5C2.5 910.017 2.93987 908.567 3.76398 907.333C4.58809 906.1 5.75943 905.139 7.12987 904.571C8.50032 904.003 10.0083 903.855 11.4632 904.144C12.918 904.433 14.2544 905.148 15.3033 906.197"
                                  stroke="#C69F6E" stroke-linecap="round"/>
                            <line id="Line 1_6" x1="5.5" y1="911.5" x2="9.5" y2="911.5" stroke="#C69F6E"
                                  stroke-linecap="round"/>
                        </g>
                        <g id="sensor_3">
                            <rect id="Rectangle 5_7" x="263.5" y="24" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 19_7" x="305.5" y="24" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 9_7" x="286" y="19" width="10" height="3" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 6_7" x="254.5" y="22" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 7_7" x="318.5" y="22" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 8_7" x="276.5" y="22" width="29" height="29" rx="1.5" fill="#4B989E"
                                  stroke="black"/>
                            <g id="Vector_10">
                                <path
                                    d="M286.25 36.3313C287.053 36.3313 287.856 36.0803 288.575 35.6178C288.682 35.5494 288.819 35.5493 288.926 35.6171C290.364 36.5297 292.137 36.5297 293.575 35.6171C293.682 35.5493 293.819 35.5494 293.925 35.6178C294.644 36.0803 295.447 36.3313 296.25 36.3313H297.2C297.366 36.3313 297.5 36.4656 297.5 36.6313V37.2813C297.5 37.4469 297.366 37.5813 297.2 37.5813H296.25C295.444 37.5813 294.638 37.3874 293.889 37.0257C293.802 36.9833 293.699 36.9835 293.611 37.026C292.124 37.7455 290.376 37.7455 288.889 37.026C288.801 36.9835 288.699 36.9833 288.611 37.0257C287.863 37.3874 287.062 37.5813 286.25 37.5813H285.3C285.135 37.5813 285 37.4469 285 37.2813V36.6313C285 36.4656 285.135 36.3313 285.3 36.3313H286.25ZM288.575 39.3678C288.682 39.2994 288.819 39.2993 288.926 39.3671C290.364 40.2797 292.137 40.2797 293.575 39.3671C293.682 39.2993 293.819 39.2994 293.925 39.3678C294.644 39.8303 295.447 40.0813 296.25 40.0813H297.2C297.366 40.0813 297.5 40.2156 297.5 40.3813V41.0313C297.5 41.1969 297.366 41.3313 297.2 41.3313H296.25C295.444 41.3313 294.638 41.1374 293.889 40.7757C293.802 40.7333 293.699 40.7335 293.611 40.776C292.124 41.4955 290.376 41.4955 288.889 40.776C288.801 40.7335 288.699 40.7333 288.611 40.7757C287.863 41.1374 287.062 41.3313 286.25 41.3313H285.3C285.135 41.3313 285 41.1969 285 41.0313V40.3813C285 40.2156 285.135 40.0813 285.3 40.0813H286.25C287.053 40.0813 287.856 39.8303 288.575 39.3678Z"
                                    fill="black"/>
                                <path
                                    d="M288.925 31.6171C288.819 31.5493 288.682 31.5494 288.575 31.6178C287.856 32.0803 287.053 32.3313 286.25 32.3313H285.3C285.134 32.3313 285 32.4656 285 32.6313V33.2813C285 33.4469 285.134 33.5813 285.3 33.5813H286.25C287.062 33.5813 287.863 33.3874 288.611 33.0257C288.699 32.9833 288.801 32.9835 288.889 33.0259C290.376 33.7455 292.124 33.7455 293.611 33.0259C293.699 32.9835 293.801 32.9833 293.889 33.0257C294.638 33.3874 295.444 33.5813 296.25 33.5813H297.2C297.366 33.5813 297.5 33.4469 297.5 33.2813V32.6313C297.5 32.4656 297.366 32.3313 297.2 32.3313H296.25C295.447 32.3313 294.644 32.0803 293.925 31.6178C293.818 31.5494 293.681 31.5493 293.575 31.6171C292.137 32.5297 290.363 32.5297 288.925 31.6171Z"
                                    fill="black"/>
                            </g>
                            <circle id="Ellipse 1_7" cx="291" cy="10.5" r="9.5" fill="#DFDFDF" stroke="black"/>
                            <circle id="Ellipse 3_7" cx="291" cy="10.5" r="0.5" stroke="#C69F6E"/>
                            <path id="Ellipse 2_7"
                                  d="M285.697 15.8033C284.648 14.7544 283.933 13.418 283.644 11.9632C283.355 10.5083 283.503 9.00032 284.071 7.62987C284.639 6.25943 285.6 5.08809 286.833 4.26398C288.067 3.43987 289.517 3 291 3C292.483 3 293.933 3.43987 295.167 4.26398C296.4 5.08809 297.361 6.25943 297.929 7.62987C298.497 9.00032 298.645 10.5083 298.356 11.9632C298.067 13.418 297.352 14.7544 296.303 15.8033"
                                  stroke="#C69F6E" stroke-linecap="round"/>
                            <line id="Line 1_7" x1="291" y1="6" x2="291" y2="10" stroke="#C69F6E"
                                  stroke-linecap="round"/>
                        </g>
                        <g id="sensor_4">
                            <rect id="Rectangle 5_8" x="124.5" y="23.5" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 19_8" x="166.5" y="23.5" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 9_8" x="147" y="18.5" width="10" height="3" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 6_8" x="115.5" y="21.5" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 7_8" x="179.5" y="21.5" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 8_8" x="137.5" y="21.5" width="29" height="29" rx="1.5" fill="#4B989E"
                                  stroke="black"/>
                            <circle id="Ellipse 1_8" cx="152" cy="10" r="9.5" fill="#DFDFDF" stroke="black"/>
                            <circle id="Ellipse 3_8" cx="152" cy="10" r="0.5" stroke="#C69F6E"/>
                            <path id="Ellipse 2_8"
                                  d="M146.697 15.3033C145.648 14.2544 144.933 12.918 144.644 11.4632C144.355 10.0083 144.503 8.50032 145.071 7.12987C145.639 5.75943 146.6 4.58809 147.833 3.76398C149.067 2.93987 150.517 2.5 152 2.5C153.483 2.5 154.933 2.93987 156.167 3.76398C157.4 4.58809 158.361 5.75943 158.929 7.12987C159.497 8.50032 159.645 10.0083 159.356 11.4632C159.067 12.918 158.352 14.2544 157.303 15.3033"
                                  stroke="#C69F6E" stroke-linecap="round"/>
                            <line id="Line 1_8" x1="152" y1="5.5" x2="152" y2="9.5" stroke="#C69F6E"
                                  stroke-linecap="round"/>
                            <g id="circum:temp-high_4">
                                <path id="Vector_11"
                                      d="M154.147 37.05V30.7042C154.143 30.1342 153.917 29.5883 153.517 29.1817C153.299 28.9654 153.036 28.7984 152.748 28.6923C152.459 28.5862 152.151 28.5434 151.845 28.5667C151.29 28.6214 150.776 28.8836 150.406 29.3007C150.036 29.7179 149.838 30.2593 149.85 30.8167L149.857 37.0267C149.308 37.4392 148.89 38.0014 148.652 38.6459C148.415 39.2903 148.369 39.9896 148.519 40.6597C148.67 41.3298 149.011 41.9422 149.501 42.4233C149.991 42.9044 150.609 43.2337 151.282 43.3717C151.517 43.4169 151.756 43.4395 151.995 43.4392C152.94 43.4392 153.847 43.0641 154.516 42.3963C155.186 41.7284 155.563 40.8223 155.565 39.8767C155.566 39.3275 155.438 38.7856 155.192 38.2947C154.946 37.8037 154.588 37.3774 154.147 37.05ZM153.787 42.045C153.461 42.3118 153.081 42.5027 152.672 42.6039C152.263 42.7051 151.837 42.714 151.425 42.63C150.877 42.521 150.375 42.2493 149.985 41.8506C149.594 41.4519 149.333 40.9446 149.235 40.395C149.138 39.8796 149.187 39.3473 149.376 38.8582C149.566 38.3692 149.888 37.9429 150.307 37.6275C150.398 37.5607 150.471 37.4737 150.522 37.3735C150.573 37.2732 150.599 37.1624 150.6 37.05V30.8167C150.591 30.4503 150.72 30.0939 150.959 29.8167C151.199 29.5395 151.533 29.3613 151.897 29.3167C151.932 29.3107 151.967 29.3082 152.002 29.3092C152.371 29.3131 152.723 29.4614 152.984 29.7221C153.245 29.9829 153.393 30.3355 153.397 30.7042V37.05C153.397 37.1624 153.424 37.2732 153.475 37.3735C153.526 37.4737 153.599 37.5607 153.69 37.6275C154.03 37.8826 154.309 38.2119 154.504 38.5904C154.698 38.969 154.804 39.3869 154.814 39.8125C154.823 40.2381 154.736 40.6603 154.558 41.0471C154.38 41.4339 154.116 41.7751 153.787 42.045Z"
                                      fill="black"/>
                                <path id="Vector_12"
                                      d="M153.42 39.8767C153.42 40.2527 153.271 40.6132 153.005 40.8791C152.739 41.1449 152.378 41.2942 152.002 41.2942C151.627 41.2942 151.266 41.1449 151 40.8791C150.734 40.6132 150.585 40.2527 150.585 39.8767C150.583 39.5668 150.685 39.2651 150.874 39.0193C151.062 38.7735 151.328 38.5975 151.627 38.5192V31.05C151.627 30.9505 151.667 30.8551 151.737 30.7848C151.808 30.7145 151.903 30.675 152.002 30.675C152.102 30.675 152.197 30.7145 152.268 30.7848C152.338 30.8551 152.377 30.9505 152.377 31.05V38.52C152.677 38.5994 152.941 38.7756 153.13 39.021C153.318 39.2664 153.42 39.5673 153.42 39.8767Z"
                                      fill="black"/>
                            </g>
                        </g>
                        <g id="valve_2">
                            <rect id="Rectangle 10" x="22.5" y="154.58" width="13" height="25"
                                  transform="rotate(-90 22.5 154.58)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19_9" x="22.5" y="112.58" width="13" height="25"
                                  transform="rotate(-90 22.5 112.58)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 11" x="20.5" y="163.58" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 20.5 163.58)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12" x="20.5" y="99.58" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 20.5 99.58)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 13" x="20.5" y="141.58" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 20.5 141.58)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 15" x="8.5" y="139.58" width="25" height="3" rx="0.5"
                                  transform="rotate(-90 8.5 139.58)" fill="#C69F6E" stroke="black"/>
                            <line id="Line 4" x1="12" y1="127.08" x2="18" y2="127.08" stroke="black" stroke-width="2"/>
                            <path id="Polygon 1" d="M11.625 135.217V118.943L18.3516 127.08L11.625 135.217Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14" x="17.5" y="131.58" width="9" height="3"
                                  transform="rotate(-90 17.5 131.58)" fill="#36767B" stroke="black"/>
                        </g>
                        <g id="valve_1">
                            <rect id="Rectangle 10_2" x="788.5" y="153.5" width="13" height="25"
                                  transform="rotate(-90 788.5 153.5)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19_10" x="788.5" y="111.5" width="13" height="25"
                                  transform="rotate(-90 788.5 111.5)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 11_2" x="786.5" y="162.5" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 162.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12_2" x="786.5" y="98.5" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 98.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 13_2" x="786.5" y="140.5" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 140.5)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 15_2" x="774.5" y="138.5" width="25" height="3" rx="0.5"
                                  transform="rotate(-90 774.5 138.5)" fill="#C69F6E" stroke="black"/>
                            <line id="Line 4_2" x1="778" y1="126" x2="784" y2="126" stroke="black" stroke-width="2"/>
                            <path id="Polygon 1_2" d="M777.625 134.137V117.863L784.352 126L777.625 134.137Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14_2" x="783.5" y="130.5" width="9" height="3"
                                  transform="rotate(-90 783.5 130.5)" fill="#36767B" stroke="black"/>
                        </g>
                        <g id="valve_9">
                            <rect id="Rectangle 10_3" x="790.5" y="1282" width="13" height="25"
                                  transform="rotate(-90 790.5 1282)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19_11" x="790.5" y="1240" width="13" height="25"
                                  transform="rotate(-90 790.5 1240)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 11_3" x="788.5" y="1291" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 788.5 1291)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12_3" x="788.5" y="1227" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 788.5 1227)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 13_3" x="788.5" y="1269" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 788.5 1269)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 15_3" x="776.5" y="1267" width="25" height="3" rx="0.5"
                                  transform="rotate(-90 776.5 1267)" fill="#C69F6E" stroke="black"/>
                            <line id="Line 4_3" x1="780" y1="1254.5" x2="786" y2="1254.5" stroke="black"
                                  stroke-width="2"/>
                            <path id="Polygon 1_3" d="M779.625 1262.64V1246.36L786.352 1254.5L779.625 1262.64Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14_3" x="785.5" y="1259" width="9" height="3"
                                  transform="rotate(-90 785.5 1259)" fill="#36767B" stroke="black"/>
                        </g>
                        <g id="valve_3">
                            <rect id="Rectangle 10_4" x="23.5" y="329.58" width="13" height="25"
                                  transform="rotate(-90 23.5 329.58)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19_12" x="23.5" y="287.58" width="13" height="25"
                                  transform="rotate(-90 23.5 287.58)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 11_4" x="21.5" y="338.58" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 338.58)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12_4" x="21.5" y="274.58" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 274.58)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 13_4" x="21.5" y="316.58" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 316.58)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 15_4" x="9.5" y="314.58" width="25" height="3" rx="0.5"
                                  transform="rotate(-90 9.5 314.58)" fill="#C69F6E" stroke="black"/>
                            <line id="Line 4_4" x1="13" y1="302.08" x2="19" y2="302.08" stroke="black"
                                  stroke-width="2"/>
                            <path id="Polygon 1_4" d="M12.625 310.217V293.943L19.3516 302.08L12.625 310.217Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14_4" x="18.5" y="306.58" width="9" height="3"
                                  transform="rotate(-90 18.5 306.58)" fill="#36767B" stroke="black"/>
                        </g>
                        <g id="valve_4">
                            <rect id="Rectangle 10_5" x="23.5" y="1281" width="13" height="25"
                                  transform="rotate(-90 23.5 1281)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 19_13" x="23.5" y="1239" width="13" height="25"
                                  transform="rotate(-90 23.5 1239)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 11_5" x="21.5" y="1290" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 1290)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12_5" x="21.5" y="1226" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 1226)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 13_5" x="21.5" y="1268" width="29" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 1268)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 15_5" x="9.5" y="1266" width="25" height="3" rx="0.5"
                                  transform="rotate(-90 9.5 1266)" fill="#C69F6E" stroke="black"/>
                            <line id="Line 4_5" x1="13" y1="1253.5" x2="19" y2="1253.5" stroke="black"
                                  stroke-width="2"/>
                            <path id="Polygon 1_5" d="M12.625 1261.64V1245.36L19.3516 1253.5L12.625 1261.64Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14_5" x="18.5" y="1258" width="9" height="3"
                                  transform="rotate(-90 18.5 1258)" fill="#36767B" stroke="black"/>
                        </g>
                        <g id="valve_11">
                            <rect id="Rectangle 10_6" x="126.5" y="1124" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 19_14" x="168.5" y="1124" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 11_6" x="117.5" y="1122" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 12_6" x="181.5" y="1122" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 13_6" x="139.5" y="1122" width="29" height="29" rx="1.5" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 15_6" x="141.5" y="1110" width="25" height="3" rx="0.5" fill="#C69F6E"
                                  stroke="black"/>
                            <line id="Line 4_6" x1="154" y1="1113.5" x2="154" y2="1119.5" stroke="black"
                                  stroke-width="2"/>
                            <path id="Polygon 1_6" d="M145.863 1113.12H162.137L154 1119.85L145.863 1113.12Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14_6" x="149.5" y="1119" width="9" height="3" fill="#36767B"
                                  stroke="black"/>
                        </g>
                        <g id="valve_10">
                            <rect id="Rectangle 10_7" x="643.5" y="202" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 19_15" x="685.5" y="202" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 11_7" x="634.5" y="200" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 12_7" x="698.5" y="200" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 13_7" x="656.5" y="200" width="29" height="29" rx="1.5" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 15_7" x="658.5" y="188" width="25" height="3" rx="0.5" fill="#C69F6E"
                                  stroke="black"/>
                            <line id="Line 4_7" x1="671" y1="191.5" x2="671" y2="197.5" stroke="black"
                                  stroke-width="2"/>
                            <path id="Polygon 1_7" d="M662.863 191.125H679.137L671 197.852L662.863 191.125Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14_7" x="666.5" y="197" width="9" height="3" fill="#36767B"
                                  stroke="black"/>
                        </g>
                        <g id="valve_6">
                            <rect id="Rectangle 10_8" x="208.5" y="1287" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 19_16" x="250.5" y="1287" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 11_8" x="199.5" y="1285" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 12_8" x="263.5" y="1285" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 13_8" x="221.5" y="1285" width="29" height="29" rx="1.5" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 15_8" x="223.5" y="1273" width="25" height="3" rx="0.5" fill="#C69F6E"
                                  stroke="black"/>
                            <line id="Line 4_8" x1="236" y1="1276.5" x2="236" y2="1282.5" stroke="black"
                                  stroke-width="2"/>
                            <path id="Polygon 1_8" d="M227.863 1276.12H244.137L236 1282.85L227.863 1276.12Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14_8" x="231.5" y="1282" width="9" height="3" fill="#36767B"
                                  stroke="black"/>
                        </g>
                        <g id="valve_8">
                            <rect id="Rectangle 10_9" x="499.5" y="1287" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 19_17" x="541.5" y="1287" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 11_9" x="490.5" y="1285" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 12_9" x="554.5" y="1285" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 13_9" x="512.5" y="1285" width="29" height="29" rx="1.5" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 15_9" x="514.5" y="1273" width="25" height="3" rx="0.5" fill="#C69F6E"
                                  stroke="black"/>
                            <line id="Line 4_9" x1="527" y1="1276.5" x2="527" y2="1282.5" stroke="black"
                                  stroke-width="2"/>
                            <path id="Polygon 1_9" d="M518.863 1276.12H535.137L527 1282.85L518.863 1276.12Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14_9" x="522.5" y="1282" width="9" height="3" fill="#36767B"
                                  stroke="black"/>
                        </g>
                        <g id="valve_7">
                            <rect id="Rectangle 10_10" x="499.5" y="1454" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 19_18" x="541.5" y="1454" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 11_10" x="490.5" y="1452" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 12_10" x="554.5" y="1452" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 13_10" x="512.5" y="1452" width="29" height="29" rx="1.5" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 15_10" x="514.5" y="1440" width="25" height="3" rx="0.5" fill="#C69F6E"
                                  stroke="black"/>
                            <line id="Line 4_10" x1="527" y1="1443.5" x2="527" y2="1449.5" stroke="black"
                                  stroke-width="2"/>
                            <path id="Polygon 1_10" d="M518.863 1443.12H535.137L527 1449.85L518.863 1443.12Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14_10" x="522.5" y="1449" width="9" height="3" fill="#36767B"
                                  stroke="black"/>
                        </g>
                        <g id="valve_5">
                            <rect id="Rectangle 10_11" x="209.5" y="1454" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 19_19" x="251.5" y="1454" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 11_11" x="200.5" y="1452" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 12_11" x="264.5" y="1452" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 13_11" x="222.5" y="1452" width="29" height="29" rx="1.5" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 15_11" x="224.5" y="1440" width="25" height="3" rx="0.5" fill="#C69F6E"
                                  stroke="black"/>
                            <line id="Line 4_11" x1="237" y1="1443.5" x2="237" y2="1449.5" stroke="black"
                                  stroke-width="2"/>
                            <path id="Polygon 1_11" d="M228.863 1443.12H245.137L237 1449.85L228.863 1443.12Z"
                                  stroke="black"/>
                            <rect id="Rectangle 14_11" x="232.5" y="1449" width="9" height="3" fill="#36767B"
                                  stroke="black"/>
                        </g>
                        <g id="t_4">
                            <rect id="Rectangle 11_12" x="20.5" y="240.5" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 20.5 240.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12_12" x="20.5" y="196" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 20.5 196)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_7" x="56.5" y="199.5" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <path id="Vector 1" d="M24.5 196L24.5 231.5H46.5V225H56.5V203H46.5V196H24.5Z" fill="#4B989E"
                                  stroke="black"/>
                        </g>
                        <g id="t_12">
                            <rect id="Rectangle 11_13" x="604.5" y="1409.5" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 604.5 1409.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12_13" x="604.5" y="1365" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 604.5 1365)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_8" x="640.5" y="1368.5" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <path id="Vector 1_2" d="M608.5 1365V1400.5H630.5V1394H640.5V1372H630.5V1365H608.5Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="t_5">
                            <rect id="Rectangle 11_14" x="21.5" y="1163.5" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 1163.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12_14" x="21.5" y="1119" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 21.5 1119)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_9" x="57.5" y="1122.5" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <path id="Vector 1_3" d="M25.5 1119L25.5 1154.5H47.5V1148H57.5V1126H47.5V1119H25.5Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="t_14">
                            <rect id="Rectangle 11_15" x="817.5" y="1110" width="9" height="29" rx="1.5"
                                  transform="rotate(90 817.5 1110)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12_15" x="817.5" y="1154.5" width="9" height="29" rx="1.5"
                                  transform="rotate(90 817.5 1154.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_10" x="781.5" y="1151" width="9" height="29" rx="1.5"
                                  transform="rotate(180 781.5 1151)" fill="#36767B" stroke="black"/>
                            <path id="Vector 1_4" d="M813.5 1154.5V1119H791.5V1125.5H781.5V1147.5H791.5V1154.5H813.5Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="t_7">
                            <rect id="Rectangle 11_16" x="171.5" y="1356" width="9" height="29" rx="1.5"
                                  transform="rotate(90 171.5 1356)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12_16" x="171.5" y="1400.5" width="9" height="29" rx="1.5"
                                  transform="rotate(90 171.5 1400.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_11" x="135.5" y="1397" width="9" height="29" rx="1.5"
                                  transform="rotate(180 135.5 1397)" fill="#36767B" stroke="black"/>
                            <path id="Vector 1_5" d="M167.5 1400.5V1365H145.5V1371.5H135.5V1393.5H145.5V1400.5H167.5Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="l_3">
                            <rect id="Rectangle 17_7" x="53.5" y="21.5" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 20_12" x="49.5" y="55.5" width="9" height="29" rx="1.5"
                                  transform="rotate(90 49.5 55.5)" fill="#36767B" stroke="black"/>
                            <path id="Vector 2_7"
                                  d="M53.2676 24.9761C53.3522 24.9775 53.4299 24.9801 53.5 24.9819V45.9595C53.4351 45.9554 53.3652 45.9496 53.291 45.9458C52.8266 45.9218 52.1851 45.9058 51.4775 45.938C50.7713 45.9701 49.9878 46.0508 49.2451 46.2241C48.5075 46.3963 47.7772 46.6674 47.2002 47.1001C46.5598 47.5804 46.1791 48.4404 45.9385 49.3306C45.6918 50.2434 45.5645 51.2966 45.501 52.2808C45.4373 53.2682 45.4373 54.2052 45.4531 54.894C45.4585 55.1259 45.4675 55.3303 45.4746 55.4995H24.9395C24.9354 55.4644 24.9301 55.4274 24.9258 55.3882C24.8867 55.0355 24.8383 54.5174 24.8037 53.8638C24.7345 52.556 24.7188 50.7067 24.9346 48.5493C25.3665 44.2301 26.7224 38.7032 30.3994 33.8003C34.0401 28.946 39.894 26.7314 44.9092 25.7407C47.4085 25.247 49.6783 25.0613 51.3232 24.9995C52.1451 24.9686 52.8098 24.9684 53.2676 24.9761Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="l_1">
                            <rect id="Rectangle 17_8" x="815.5" y="54.5" width="9" height="29" rx="1.5"
                                  transform="rotate(90 815.5 54.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_13" x="781.5" y="50.5" width="9" height="29" rx="1.5"
                                  transform="rotate(-180 781.5 50.5)" fill="#36767B" stroke="black"/>
                            <path id="Vector 2_8"
                                  d="M812.023 54.2678C812.022 54.3524 812.019 54.4301 812.018 54.5002H791.04C791.044 54.4353 791.05 54.3655 791.054 54.2913C791.078 53.8268 791.094 53.1853 791.062 52.4778C791.029 51.7715 790.949 50.988 790.775 50.2454C790.603 49.5078 790.332 48.7775 789.899 48.2004C789.419 47.56 788.559 47.1793 787.669 46.9387C786.756 46.6921 785.703 46.5647 784.719 46.5012C783.731 46.4375 782.794 46.4375 782.105 46.4534C781.874 46.4587 781.669 46.4677 781.5 46.4749V25.9397C781.535 25.9356 781.572 25.9304 781.611 25.926C781.964 25.8869 782.482 25.8386 783.136 25.804C784.444 25.7347 786.293 25.7191 788.45 25.9348C792.769 26.3668 798.296 27.7226 803.199 31.3997C808.053 35.0403 810.268 40.8943 811.259 45.9094C811.752 48.4088 811.938 50.6785 812 52.3235C812.031 53.1454 812.031 53.81 812.023 54.2678Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                        <g id="tank_2">
                            <rect id="Rectangle 5_9" x="340.5" y="1287" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 19_20" x="422.5" y="1287" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 6_9" x="331.5" y="1285" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 7_9" x="435.5" y="1285" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <path id="Rectangle 20_14"
                                  d="M355 1277.5C355 1276.4 355.895 1275.5 357 1275.5H419C420.105 1275.5 421 1276.4 421 1277.5V1319.5C421 1320.05 420.552 1320.5 420 1320.5H356C355.448 1320.5 355 1320.05 355 1319.5V1277.5Z"
                                  fill="#80C6F1"/>
                            <g id="Subtract">
                                <mask id="path-275-inside-1_126_639" fill="white">
                                    <path
                                        d="M421 1262.5C422.105 1262.5 423 1263.4 423 1264.5V1320.5L422.989 1320.7C422.894 1321.65 422.146 1322.39 421.204 1322.49L421 1322.5H355L354.796 1322.49C353.854 1322.39 353.106 1321.65 353.011 1320.7L353 1320.5V1264.5C353 1263.4 353.895 1262.5 355 1262.5V1263.5C354.448 1263.5 354 1263.95 354 1264.5V1320.5C354 1321.05 354.448 1321.5 355 1321.5H421C421.552 1321.5 422 1321.05 422 1320.5V1264.5C422 1263.95 421.552 1263.5 421 1263.5V1262.5Z"/>
                                </mask>
                                <path
                                    d="M421 1262.5V1261.5C420.448 1261.5 420 1261.95 420 1262.5H421ZM423 1264.5H424V1264.5H423ZM423 1320.5L423.999 1320.55C424 1320.54 424 1320.52 424 1320.5H423ZM422.989 1320.7L423.984 1320.8C423.986 1320.79 423.987 1320.77 423.988 1320.76L422.989 1320.7ZM421.204 1322.49L421.257 1323.49C421.273 1323.49 421.289 1323.49 421.305 1323.48L421.204 1322.49ZM421 1322.5V1323.5C421.018 1323.5 421.035 1323.5 421.053 1323.5L421 1322.5ZM355 1322.5L354.947 1323.5C354.965 1323.5 354.982 1323.5 355 1323.5V1322.5ZM354.796 1322.49L354.695 1323.48C354.711 1323.49 354.727 1323.49 354.743 1323.49L354.796 1322.49ZM353.011 1320.7L352.012 1320.76C352.013 1320.77 352.014 1320.79 352.016 1320.8L353.011 1320.7ZM353 1320.5H352C352 1320.52 352 1320.54 352.001 1320.55L353 1320.5ZM353 1264.5L352 1264.5V1264.5H353ZM355 1262.5H356C356 1262.23 355.895 1261.98 355.707 1261.79C355.52 1261.61 355.265 1261.5 355 1261.5V1262.5ZM355 1263.5V1264.5C355.552 1264.5 356 1264.05 356 1263.5H355ZM354 1264.5L353 1264.5V1264.5H354ZM354 1320.5H353V1320.5H354ZM421 1321.5V1322.5V1321.5ZM422 1320.5H423V1320.5H422ZM422 1264.5H423V1264.5L422 1264.5ZM421 1263.5H420C420 1264.05 420.448 1264.5 421 1264.5V1263.5ZM421 1262.5V1263.5C421.552 1263.5 422 1263.95 422 1264.5H423H424C424 1262.84 422.657 1261.5 421 1261.5V1262.5ZM423 1264.5H422V1320.5H423H424V1264.5H423ZM423 1320.5L422.001 1320.45L421.991 1320.65L422.989 1320.7L423.988 1320.76L423.999 1320.55L423 1320.5ZM422.989 1320.7L421.994 1320.6C421.947 1321.07 421.572 1321.45 421.103 1321.49L421.204 1322.49L421.305 1323.48C422.719 1323.34 423.841 1322.22 423.984 1320.8L422.989 1320.7ZM421.204 1322.49L421.152 1321.49L420.947 1321.5L421 1322.5L421.053 1323.5L421.257 1323.49L421.204 1322.49ZM421 1322.5V1321.5H355V1322.5V1323.5H421V1322.5ZM355 1322.5L355.053 1321.5L354.848 1321.49L354.796 1322.49L354.743 1323.49L354.947 1323.5L355 1322.5ZM354.796 1322.49L354.897 1321.49C354.428 1321.45 354.053 1321.07 354.006 1320.6L353.011 1320.7L352.016 1320.8C352.159 1322.22 353.281 1323.34 354.695 1323.48L354.796 1322.49ZM353.011 1320.7L354.009 1320.65L353.999 1320.45L353 1320.5L352.001 1320.55L352.012 1320.76L353.011 1320.7ZM353 1320.5H354V1264.5H353H352V1320.5H353ZM353 1264.5L354 1264.5C354 1263.95 354.448 1263.5 355 1263.5V1262.5V1261.5C353.343 1261.5 352 1262.84 352 1264.5L353 1264.5ZM355 1262.5H354V1263.5H355H356V1262.5H355ZM355 1263.5V1262.5C353.895 1262.5 353 1263.4 353 1264.5L354 1264.5L355 1264.5V1264.5V1263.5ZM354 1264.5H353V1320.5H354H355V1264.5H354ZM354 1320.5H353C353 1321.6 353.895 1322.5 355 1322.5V1321.5V1320.5V1320.5H354ZM355 1321.5V1322.5H421V1321.5V1320.5H355V1321.5ZM421 1321.5V1322.5C422.105 1322.5 423 1321.6 423 1320.5H422H421V1320.5V1321.5ZM422 1320.5H423V1264.5H422H421V1320.5H422ZM422 1264.5L423 1264.5C423 1263.4 422.105 1262.5 421 1262.5V1263.5V1264.5V1264.5H422ZM421 1263.5H422V1262.5H421H420V1263.5H421Z"
                                    fill="black" mask="url(#path-275-inside-1_126_639)"/>
                            </g>
                            <g id="ion:water">
                                <path id="Vector_13"
                                      d="M388 1289.47C388.031 1289.47 388.061 1289.48 388.089 1289.49C388.117 1289.5 388.141 1289.52 388.161 1289.55C388.897 1290.41 390.465 1292.33 391.847 1294.58C393.237 1296.84 394.4 1299.38 394.4 1301.5C394.4 1303.5 393.773 1305.09 392.681 1306.18C391.588 1307.27 389.996 1307.9 388 1307.9C386.004 1307.9 384.412 1307.27 383.319 1306.18C382.227 1305.09 381.6 1303.5 381.6 1301.5C381.6 1299.38 382.763 1296.84 384.153 1294.58C385.19 1292.89 386.33 1291.39 387.146 1290.38L387.839 1289.55C387.859 1289.52 387.883 1289.5 387.911 1289.49C387.939 1289.48 387.969 1289.47 388 1289.47ZM392.251 1300.97C392.142 1300.95 392.032 1300.96 391.926 1300.98L391.821 1301.01C391.642 1301.08 391.486 1301.19 391.377 1301.35C391.269 1301.5 391.211 1301.69 391.213 1301.88C391.211 1302.53 390.951 1303.15 390.49 1303.62C390.087 1304.02 389.558 1304.27 388.995 1304.32L388.753 1304.34C388.564 1304.34 388.379 1304.39 388.225 1304.5C388.069 1304.61 387.951 1304.77 387.889 1304.95C387.84 1305.08 387.825 1305.23 387.845 1305.38C387.865 1305.52 387.919 1305.66 388.004 1305.78C388.088 1305.9 388.201 1305.99 388.331 1306.06C388.461 1306.13 388.604 1306.16 388.75 1306.16C389.887 1306.16 390.977 1305.71 391.78 1304.91C392.584 1304.1 393.036 1303.01 393.037 1301.88L393.031 1301.77C393.018 1301.66 392.987 1301.55 392.937 1301.46C392.87 1301.33 392.772 1301.21 392.652 1301.13C392.533 1301.04 392.396 1300.99 392.251 1300.97Z"
                                      fill="#4809E7" stroke="black" stroke-width="0.7"/>
                            </g>
                        </g>
                        <g id="tank_1">
                            <rect id="Rectangle 5_10" x="341.5" y="1454" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 19_21" x="423.5" y="1454" width="13" height="25" fill="#4B989E"
                                  stroke="black"/>
                            <rect id="Rectangle 6_10" x="332.5" y="1452" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <rect id="Rectangle 7_10" x="436.5" y="1452" width="9" height="29" rx="1.5" fill="#36767B"
                                  stroke="black"/>
                            <path id="Rectangle 20_15"
                                  d="M356 1444.5C356 1443.4 356.895 1442.5 358 1442.5H420C421.105 1442.5 422 1443.4 422 1444.5V1486.5C422 1487.05 421.552 1487.5 421 1487.5H357C356.448 1487.5 356 1487.05 356 1486.5V1444.5Z"
                                  fill="#80C6F1"/>
                            <g id="Subtract_2">
                                <mask id="path-283-inside-2_126_639" fill="white">
                                    <path
                                        d="M422 1429.5C423.105 1429.5 424 1430.4 424 1431.5V1487.5L423.989 1487.7C423.894 1488.65 423.146 1489.39 422.204 1489.49L422 1489.5H356L355.796 1489.49C354.854 1489.39 354.106 1488.65 354.011 1487.7L354 1487.5V1431.5C354 1430.4 354.895 1429.5 356 1429.5V1430.5C355.448 1430.5 355 1430.95 355 1431.5V1487.5C355 1488.05 355.448 1488.5 356 1488.5H422C422.552 1488.5 423 1488.05 423 1487.5V1431.5C423 1430.95 422.552 1430.5 422 1430.5V1429.5Z"/>
                                </mask>
                                <path
                                    d="M422 1429.5V1428.5C421.448 1428.5 421 1428.95 421 1429.5H422ZM424 1431.5H425V1431.5H424ZM424 1487.5L424.999 1487.55C425 1487.54 425 1487.52 425 1487.5H424ZM423.989 1487.7L424.984 1487.8C424.986 1487.79 424.987 1487.77 424.988 1487.76L423.989 1487.7ZM422.204 1489.49L422.257 1490.49C422.273 1490.49 422.289 1490.49 422.305 1490.48L422.204 1489.49ZM422 1489.5V1490.5C422.018 1490.5 422.035 1490.5 422.053 1490.5L422 1489.5ZM356 1489.5L355.947 1490.5C355.965 1490.5 355.982 1490.5 356 1490.5V1489.5ZM355.796 1489.49L355.695 1490.48C355.711 1490.49 355.727 1490.49 355.743 1490.49L355.796 1489.49ZM354.011 1487.7L353.012 1487.76C353.013 1487.77 353.014 1487.79 353.016 1487.8L354.011 1487.7ZM354 1487.5H353C353 1487.52 353 1487.54 353.001 1487.55L354 1487.5ZM354 1431.5L353 1431.5V1431.5H354ZM356 1429.5H357C357 1429.23 356.895 1428.98 356.707 1428.79C356.52 1428.61 356.265 1428.5 356 1428.5V1429.5ZM356 1430.5V1431.5C356.552 1431.5 357 1431.05 357 1430.5H356ZM355 1431.5L354 1431.5V1431.5H355ZM355 1487.5H354V1487.5H355ZM422 1488.5V1489.5V1488.5ZM423 1487.5H424V1487.5H423ZM423 1431.5H424V1431.5L423 1431.5ZM422 1430.5H421C421 1431.05 421.448 1431.5 422 1431.5V1430.5ZM422 1429.5V1430.5C422.552 1430.5 423 1430.95 423 1431.5H424H425C425 1429.84 423.657 1428.5 422 1428.5V1429.5ZM424 1431.5H423V1487.5H424H425V1431.5H424ZM424 1487.5L423.001 1487.45L422.991 1487.65L423.989 1487.7L424.988 1487.76L424.999 1487.55L424 1487.5ZM423.989 1487.7L422.994 1487.6C422.947 1488.07 422.572 1488.45 422.103 1488.49L422.204 1489.49L422.305 1490.48C423.719 1490.34 424.841 1489.22 424.984 1487.8L423.989 1487.7ZM422.204 1489.49L422.152 1488.49L421.947 1488.5L422 1489.5L422.053 1490.5L422.257 1490.49L422.204 1489.49ZM422 1489.5V1488.5H356V1489.5V1490.5H422V1489.5ZM356 1489.5L356.053 1488.5L355.848 1488.49L355.796 1489.49L355.743 1490.49L355.947 1490.5L356 1489.5ZM355.796 1489.49L355.897 1488.49C355.428 1488.45 355.053 1488.07 355.006 1487.6L354.011 1487.7L353.016 1487.8C353.159 1489.22 354.281 1490.34 355.695 1490.48L355.796 1489.49ZM354.011 1487.7L355.009 1487.65L354.999 1487.45L354 1487.5L353.001 1487.55L353.012 1487.76L354.011 1487.7ZM354 1487.5H355V1431.5H354H353V1487.5H354ZM354 1431.5L355 1431.5C355 1430.95 355.448 1430.5 356 1430.5V1429.5V1428.5C354.343 1428.5 353 1429.84 353 1431.5L354 1431.5ZM356 1429.5H355V1430.5H356H357V1429.5H356ZM356 1430.5V1429.5C354.895 1429.5 354 1430.4 354 1431.5L355 1431.5L356 1431.5V1431.5V1430.5ZM355 1431.5H354V1487.5H355H356V1431.5H355ZM355 1487.5H354C354 1488.6 354.895 1489.5 356 1489.5V1488.5V1487.5V1487.5H355ZM356 1488.5V1489.5H422V1488.5V1487.5H356V1488.5ZM422 1488.5V1489.5C423.105 1489.5 424 1488.6 424 1487.5H423H422V1487.5V1488.5ZM423 1487.5H424V1431.5H423H422V1487.5H423ZM423 1431.5L424 1431.5C424 1430.4 423.105 1429.5 422 1429.5V1430.5V1431.5V1431.5H423ZM422 1430.5H423V1429.5H422H421V1430.5H422Z"
                                    fill="black" mask="url(#path-283-inside-2_126_639)"/>
                            </g>
                            <g id="ion:water_2">
                                <path id="Vector_14"
                                      d="M389 1456.47C389.031 1456.47 389.061 1456.48 389.089 1456.49C389.117 1456.5 389.141 1456.52 389.161 1456.55C389.897 1457.41 391.465 1459.33 392.847 1461.58C394.237 1463.84 395.4 1466.38 395.4 1468.5C395.4 1470.5 394.773 1472.09 393.681 1473.18C392.588 1474.27 390.996 1474.9 389 1474.9C387.004 1474.9 385.412 1474.27 384.319 1473.18C383.227 1472.09 382.6 1470.5 382.6 1468.5C382.6 1466.38 383.763 1463.84 385.153 1461.58C386.19 1459.89 387.33 1458.39 388.146 1457.38L388.839 1456.55C388.859 1456.52 388.883 1456.5 388.911 1456.49C388.939 1456.48 388.969 1456.47 389 1456.47ZM393.251 1467.97C393.142 1467.95 393.032 1467.96 392.926 1467.98L392.821 1468.01C392.642 1468.08 392.486 1468.19 392.377 1468.35C392.269 1468.5 392.211 1468.69 392.213 1468.88C392.211 1469.53 391.951 1470.15 391.49 1470.62C391.087 1471.02 390.558 1471.27 389.995 1471.32L389.753 1471.34C389.564 1471.34 389.379 1471.39 389.225 1471.5C389.069 1471.61 388.951 1471.77 388.889 1471.95C388.84 1472.08 388.825 1472.23 388.845 1472.38C388.865 1472.52 388.919 1472.66 389.004 1472.78C389.088 1472.9 389.201 1472.99 389.331 1473.06C389.461 1473.13 389.604 1473.16 389.75 1473.16C390.887 1473.16 391.977 1472.71 392.78 1471.91C393.584 1471.1 394.036 1470.01 394.037 1468.88L394.031 1468.77C394.018 1468.66 393.987 1468.55 393.937 1468.46C393.87 1468.33 393.772 1468.21 393.652 1468.13C393.533 1468.04 393.396 1467.99 393.251 1467.97Z"
                                      fill="#4809E7" stroke="black" stroke-width="0.7"/>
                            </g>
                        </g>
                        <g id="pipe_37">
                            <rect x="65.5" y="202" width="569" height="25" fill="#4B989E"/>
                            <rect x="65.5" y="202" width="569" height="25" stroke="black"/>
                        </g>
                        <g id="pipe_9">
                            <rect x="22.5" y="90.5" width="26" height="25" transform="rotate(-90 22.5 90.5)"
                                  fill="#4B989E"/>
                            <rect x="22.5" y="90.5" width="26" height="25" transform="rotate(-90 22.5 90.5)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_10">
                            <rect x="22.5" y="187" width="23" height="25" transform="rotate(-90 22.5 187)"
                                  fill="#4B989E"/>
                            <rect x="22.5" y="187" width="23" height="25" transform="rotate(-90 22.5 187)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_11">
                            <rect x="23.5" y="265" width="24" height="25" transform="rotate(-90 23.5 265)"
                                  fill="#4B989E"/>
                            <rect x="23.5" y="265" width="24" height="25" transform="rotate(-90 23.5 265)"
                                  stroke="black"/>
                        </g>
                        <g id="pipe_36">
                            <rect x="707.5" y="202" width="63" height="25" fill="#4B989E"/>
                            <rect x="707.5" y="202" width="63" height="25" stroke="black"/>
                        </g>
                        <g id="pump_1">
                            <rect id="Rectangle 5_11" x="788.5" y="781" width="13" height="25"
                                  transform="rotate(-90 788.5 781)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 28" x="788.5" y="739" width="30" height="25"
                                  transform="rotate(-90 788.5 739)" fill="#4B989E" stroke="black"/>
                            <rect id="Rectangle 6_11" x="786.5" y="790" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 790)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 7_11" x="786.5" y="709" width="9" height="29" rx="1.5"
                                  transform="rotate(-90 786.5 709)" fill="#36767B" stroke="black"/>
                            <path id="Vector 3"
                                  d="M796.863 738.812H812C814.209 738.812 816 740.602 816 742.812V764.554C816 766.763 814.209 768.554 812 768.554H796.858C796.472 768.554 796.123 768.768 795.937 769.106C794.453 771.809 787.164 783.5 772.14 783.5C755.154 783.5 743.863 769.659 744.001 753.255C744.139 736.851 754.652 724.642 771.636 723.552C786.734 722.583 794.42 735.394 795.942 738.253C796.125 738.596 796.475 738.812 796.863 738.812Z"
                                  fill="#36767B" stroke="black"/>
                            <path id="Vector 4"
                                  d="M787.502 739.499V766.499C787.502 766.499 783.001 773.61 772.002 773.499C761.002 773.387 751.865 764.044 752.002 752.999C752.138 741.954 762.001 732.499 772.002 732.999C782.002 733.498 787.502 739.499 787.502 739.499Z"
                                  fill="#DFDFDF" stroke="black"/>
                            <g id="Frame 2">
                                <rect id="Rectangle 20_16" x="767.5" y="765.5" width="7" height="7" rx="1.5"
                                      transform="rotate(-90 767.5 765.5)" fill="#C69F6E" stroke="black"/>
                                <rect id="Rectangle 21" x="767.5" y="756.5" width="7" height="7" rx="1.5"
                                      transform="rotate(-90 767.5 756.5)" fill="#C69F6E" stroke="black"/>
                                <rect id="Rectangle 22" x="767.5" y="747.5" width="7" height="7" rx="1.5"
                                      transform="rotate(-90 767.5 747.5)" fill="#C69F6E" stroke="black"/>
                            </g>
                        </g>
                        <g id="t_1">
                            <rect id="Rectangle 11_17" x="815.5" y="187.5" width="9" height="29" rx="1.5"
                                  transform="rotate(90 815.5 187.5)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 12_17" x="815.5" y="232" width="9" height="29" rx="1.5"
                                  transform="rotate(90 815.5 232)" fill="#36767B" stroke="black"/>
                            <rect id="Rectangle 20_17" x="779.5" y="228.5" width="9" height="29" rx="1.5"
                                  transform="rotate(180 779.5 228.5)" fill="#36767B" stroke="black"/>
                            <path id="Vector 1_6" d="M811.5 232V196.5H789.5V203H779.5V225H789.5V232H811.5Z"
                                  fill="#4B989E" stroke="black"/>
                        </g>
                    </g>
                </svg>

            </div>

            {tip.open && tooltipData && (
                <div
                    ref={tooltipRef}
                    className="pointer-events-none absolute z-50 rounded-xl border border-white/15 bg-zinc-950/95 px-3 py-2 text-xs text-white/90 shadow-lg"
                    style={{
                        left: tooltipPos?.x ?? tip.x,
                        top: tooltipPos?.y ?? tip.y,
                    }}
                >
                    <div className="font-semibold">{tooltipData.title}</div>
                    <div className="mt-1 text-white/70 space-y-0.5">
                        {tooltipData.lines.map((l) => <div key={l}>{l}</div>)}
                    </div>
                </div>
            )}
        </div>
    );
}
