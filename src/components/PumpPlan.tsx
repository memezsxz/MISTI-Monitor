"use client";
import PumpPlan from "@/public/pump_plan.svg";

import React, { useMemo, useRef, useState } from "react";

type TooltipState = {
    open: boolean;
    x: number;
    y: number;
    targetId: string | null;
};

function findInteractiveId(el: Element | null) {
    while (el) {
        const id = (el as HTMLElement).id;
        if (id && /^(sensor|valve|pump|tank|pipe|connector)_/.test(id)) return id;
        el = el.parentElement;
    }
    return null;
}

export function PumpPlanView() {
    const wrapRef = useRef<HTMLDivElement | null>(null);

    // later: replace with DB-fed data keyed by id
    const infoById = useMemo(() => ({
        sensor_1: { title: "Sensor 1", lines: ["Flow: 2.3 L/min", "Status: OK"] },
        pump_1: { title: "Pump", lines: ["RPM: 1450", "Vibration: Low"] },
        valve_10: { title: "Valve 10", lines: ["Position: 30%", "ΔP: normal"] },
        valve_11: { title: "Valve 11", lines: ["Position: 40%", "ΔP: normal"] },
    }), []);

    const [hoverId, setHoverId] = useState<string | null>(null);
    const [tip, setTip] = useState<TooltipState>({ open: false, x: 0, y: 0, targetId: null });

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

    const tooltipData = tip.targetId ? infoById[tip.targetId as keyof typeof infoById] : null;

    return (
        <div ref={wrapRef} className="relative w-full overflow-visible rounded-2xl border border-white/10 bg-zinc-950">
            <div >
                <svg
                    viewBox="0 0 819 1492"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    onMouseMove={onMove}
                    onMouseLeave={onLeave}
                    className="block"
                >                        <g id="pump_plan">
                            <rect id="pipe_6" x="328.5" y="23.5" width="445" height="25" stroke="white"/>
                            <rect id="pipe_37" x="66.5" y="202.5" width="568" height="25" stroke="white"/>
                            <rect id="pipe_36" x="709.5" y="202.5" width="62" height="25" stroke="white"/>
                            <rect id="pipe_7" x="189.5" y="23.5" width="66" height="25" stroke="white"/>
                            <g id="pipe_39">
                                <rect id="Rectangle 30" x="191.5" y="1127.5" width="580" height="25" stroke="white"/>
                            </g>
                            <rect id="pipe_8" x="63.5" y="23.5" width="53" height="25" stroke="white"/>
                            <rect id="pipe_13" x="48.5" y="490.5" width="39" height="25" transform="rotate(90 48.5 490.5)" stroke="white"/>
                            <rect id="pipe_14" x="48.5" y="602.5" width="162" height="25" transform="rotate(90 48.5 602.5)" stroke="white"/>
                            <g id="sensor_5">
                                <rect id="Rectangle 5" x="23.5" y="480.5" width="13" height="25" transform="rotate(-90 23.5 480.5)" stroke="white"/>
                                <rect id="Rectangle 19" x="23.5" y="438.5" width="13" height="25" transform="rotate(-90 23.5 438.5)" stroke="white"/>
                                <rect id="Rectangle 9" x="18.5" y="458" width="10" height="3" transform="rotate(-90 18.5 458)" stroke="white"/>
                                <rect id="Rectangle 6" x="21.5" y="489.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 489.5)" stroke="white"/>
                                <rect id="Rectangle 7" x="21.5" y="425.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 425.5)" stroke="white"/>
                                <rect id="Rectangle 8" x="21.5" y="467.5" width="29" height="29" rx="1.5" transform="rotate(-90 21.5 467.5)" stroke="white"/>
                                <circle id="Ellipse 1" cx="10" cy="453" r="9.5" transform="rotate(-90 10 453)" stroke="white"/>
                                <circle id="Ellipse 3" cx="10" cy="453" r="0.5" transform="rotate(-90 10 453)" stroke="white"/>
                                <path id="Ellipse 2" d="M15.3033 458.303C14.2544 459.352 12.918 460.067 11.4632 460.356C10.0083 460.645 8.50032 460.497 7.12987 459.929C5.75943 459.361 4.58809 458.4 3.76398 457.167C2.93987 455.933 2.5 454.483 2.5 453C2.5 451.517 2.93987 450.067 3.76398 448.833C4.58809 447.6 5.75943 446.639 7.12987 446.071C8.50032 445.503 10.0083 445.355 11.4632 445.644C12.918 445.933 14.2544 446.648 15.3033 447.697" stroke="white" stroke-linecap="round"/>
                                <line id="Line 1" x1="5.5" y1="453" x2="9.5" y2="453" stroke="white" stroke-linecap="round"/>
                            </g>
                            <g id="sensor_6">
                                <rect id="Rectangle 5_2" x="23.5" y="593.5" width="13" height="25" transform="rotate(-90 23.5 593.5)" stroke="white"/>
                                <rect id="Rectangle 19_2" x="23.5" y="551.5" width="13" height="25" transform="rotate(-90 23.5 551.5)" stroke="white"/>
                                <rect id="Rectangle 9_2" x="18.5" y="571" width="10" height="3" transform="rotate(-90 18.5 571)" stroke="white"/>
                                <rect id="Rectangle 6_2" x="21.5" y="602.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 602.5)" stroke="white"/>
                                <rect id="Rectangle 7_2" x="21.5" y="538.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 538.5)" stroke="white"/>
                                <rect id="Rectangle 8_2" x="21.5" y="580.5" width="29" height="29" rx="1.5" transform="rotate(-90 21.5 580.5)" stroke="white"/>
                                <circle id="Ellipse 1_2" cx="10" cy="566" r="9.5" transform="rotate(-90 10 566)" stroke="white"/>
                                <circle id="Ellipse 3_2" cx="10" cy="566" r="0.5" transform="rotate(-90 10 566)" stroke="white"/>
                                <path id="Ellipse 2_2" d="M15.3033 571.303C14.2544 572.352 12.918 573.067 11.4632 573.356C10.0083 573.645 8.50032 573.497 7.12987 572.929C5.75943 572.361 4.58809 571.4 3.76398 570.167C2.93987 568.933 2.5 567.483 2.5 566C2.5 564.517 2.93987 563.067 3.76398 561.833C4.58809 560.6 5.75943 559.639 7.12987 559.071C8.50032 558.503 10.0083 558.355 11.4632 558.644C12.918 558.933 14.2544 559.648 15.3033 560.697" stroke="white" stroke-linecap="round"/>
                                <line id="Line 1_2" x1="5.5" y1="566" x2="9.5" y2="566" stroke="white" stroke-linecap="round"/>
                            </g>
                            <rect id="pipe_15" x="48.5" y="838.5" width="39" height="25" transform="rotate(90 48.5 838.5)" stroke="white"/>
                            <rect id="pipe_16" x="48.5" y="950.5" width="162" height="25" transform="rotate(90 48.5 950.5)" stroke="white"/>
                            <rect id="pipe_17" x="48.5" y="1166.5" width="53" height="25" transform="rotate(90 48.5 1166.5)" stroke="white"/>
                            <rect id="pipe_34" x="815.5" y="1167.5" width="53" height="25" transform="rotate(90 815.5 1167.5)" stroke="white"/>
                            <rect id="pipe_33" x="815.5" y="1293.5" width="62" height="25" transform="rotate(90 815.5 1293.5)" stroke="white"/>
                            <rect id="pipe_38" x="117.5" y="1127.5" width="22" height="50" transform="rotate(90 117.5 1127.5)" stroke="white"/>
                            <rect id="pipe_18" x="48.5" y="1293.5" width="64" height="25" transform="rotate(90 48.5 1293.5)" stroke="white"/>
                            <g id="sensor_7">
                                <rect id="Rectangle 5_3" x="23.5" y="828.5" width="13" height="25" transform="rotate(-90 23.5 828.5)" stroke="white"/>
                                <rect id="Rectangle 19_3" x="23.5" y="786.5" width="13" height="25" transform="rotate(-90 23.5 786.5)" stroke="white"/>
                                <rect id="Rectangle 9_3" x="18.5" y="806" width="10" height="3" transform="rotate(-90 18.5 806)" stroke="white"/>
                                <rect id="Rectangle 6_3" x="21.5" y="837.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 837.5)" stroke="white"/>
                                <rect id="Rectangle 7_3" x="21.5" y="773.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 773.5)" stroke="white"/>
                                <rect id="Rectangle 8_3" x="21.5" y="815.5" width="29" height="29" rx="1.5" transform="rotate(-90 21.5 815.5)" stroke="white"/>
                                <circle id="Ellipse 1_3" cx="10" cy="801" r="9.5" transform="rotate(-90 10 801)" stroke="white"/>
                                <circle id="Ellipse 3_3" cx="10" cy="801" r="0.5" transform="rotate(-90 10 801)" stroke="white"/>
                                <path id="Ellipse 2_3" d="M15.3033 806.303C14.2544 807.352 12.918 808.067 11.4632 808.356C10.0083 808.645 8.50032 808.497 7.12987 807.929C5.75943 807.361 4.58809 806.4 3.76398 805.167C2.93987 803.933 2.5 802.483 2.5 801C2.5 799.517 2.93987 798.067 3.76398 796.833C4.58809 795.6 5.75943 794.639 7.12987 794.071C8.50032 793.503 10.0083 793.355 11.4632 793.644C12.918 793.933 14.2544 794.648 15.3033 795.697" stroke="white" stroke-linecap="round"/>
                                <line id="Line 1_3" x1="5.5" y1="801" x2="9.5" y2="801" stroke="white" stroke-linecap="round"/>
                            </g>
                            <g id="sensor_8">
                                <rect id="Rectangle 5_4" x="23.5" y="941.5" width="13" height="25" transform="rotate(-90 23.5 941.5)" stroke="white"/>
                                <rect id="Rectangle 19_4" x="23.5" y="899.5" width="13" height="25" transform="rotate(-90 23.5 899.5)" stroke="white"/>
                                <rect id="Rectangle 9_4" x="18.5" y="919" width="10" height="3" transform="rotate(-90 18.5 919)" stroke="white"/>
                                <rect id="Rectangle 6_4" x="21.5" y="950.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 950.5)" stroke="white"/>
                                <rect id="Rectangle 7_4" x="21.5" y="886.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 886.5)" stroke="white"/>
                                <rect id="Rectangle 8_4" x="21.5" y="928.5" width="29" height="29" rx="1.5" transform="rotate(-90 21.5 928.5)" stroke="white"/>
                                <circle id="Ellipse 1_4" cx="10" cy="914" r="9.5" transform="rotate(-90 10 914)" stroke="white"/>
                                <circle id="Ellipse 3_4" cx="10" cy="914" r="0.5" transform="rotate(-90 10 914)" stroke="white"/>
                                <path id="Ellipse 2_4" d="M15.3033 919.303C14.2544 920.352 12.918 921.067 11.4632 921.356C10.0083 921.645 8.50032 921.497 7.12987 920.929C5.75943 920.361 4.58809 919.4 3.76398 918.167C2.93987 916.933 2.5 915.483 2.5 914C2.5 912.517 2.93987 911.067 3.76398 909.833C4.58809 908.6 5.75943 907.639 7.12987 907.071C8.50032 906.503 10.0083 906.355 11.4632 906.644C12.918 906.933 14.2544 907.648 15.3033 908.697" stroke="white" stroke-linecap="round"/>
                                <line id="Line 1_4" x1="5.5" y1="914" x2="9.5" y2="914" stroke="white" stroke-linecap="round"/>
                            </g>
                            <g id="sensor_4">
                                <rect id="Rectangle 5_5" x="125.5" y="23.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 19_5" x="167.5" y="23.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 9_5" x="148" y="18.5" width="10" height="3" stroke="white"/>
                                <rect id="Rectangle 6_5" x="116.5" y="21.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 7_5" x="180.5" y="21.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 8_5" x="138.5" y="21.5" width="29" height="29" rx="1.5" stroke="white"/>
                                <circle id="Ellipse 1_5" cx="153" cy="10" r="9.5" stroke="white"/>
                                <circle id="Ellipse 3_5" cx="153" cy="10" r="0.5" stroke="white"/>
                                <path id="Ellipse 2_5" d="M147.697 15.3033C146.648 14.2544 145.933 12.918 145.644 11.4632C145.355 10.0083 145.503 8.50032 146.071 7.12987C146.639 5.75943 147.6 4.58809 148.833 3.76398C150.067 2.93987 151.517 2.5 153 2.5C154.483 2.5 155.933 2.93987 157.167 3.76398C158.4 4.58809 159.361 5.75943 159.929 7.12987C160.497 8.50032 160.645 10.0083 160.356 11.4632C160.067 12.918 159.352 14.2544 158.303 15.3033" stroke="white" stroke-linecap="round"/>
                                <line id="Line 1_5" x1="153" y1="5.5" x2="153" y2="9.5" stroke="white" stroke-linecap="round"/>
                            </g>
                            <g id="sensor_3">
                                <rect id="Rectangle 5_6" x="264.5" y="23.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 19_6" x="306.5" y="23.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 9_6" x="287" y="18.5" width="10" height="3" stroke="white"/>
                                <rect id="Rectangle 6_6" x="255.5" y="21.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 7_6" x="319.5" y="21.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 8_6" x="277.5" y="21.5" width="29" height="29" rx="1.5" stroke="white"/>
                                <circle id="Ellipse 1_6" cx="292" cy="10" r="9.5" stroke="white"/>
                                <circle id="Ellipse 3_6" cx="292" cy="10" r="0.5" stroke="white"/>
                                <path id="Ellipse 2_6" d="M286.697 15.3033C285.648 14.2544 284.933 12.918 284.644 11.4632C284.355 10.0083 284.503 8.50032 285.071 7.12987C285.639 5.75943 286.6 4.58809 287.833 3.76398C289.067 2.93987 290.517 2.5 292 2.5C293.483 2.5 294.933 2.93987 296.167 3.76398C297.4 4.58809 298.361 5.75943 298.929 7.12987C299.497 8.50032 299.645 10.0083 299.356 11.4632C299.067 12.918 298.352 14.2544 297.303 15.3033" stroke="white" stroke-linecap="round"/>
                                <line id="Line 1_6" x1="292" y1="5.5" x2="292" y2="9.5" stroke="white" stroke-linecap="round"/>
                            </g>
                            <rect id="pipe_2" x="789" y="547" width="66" height="25" transform="rotate(-90 789 547)" stroke="white"/>
                            <rect id="pipe_1" x="789.5" y="702.5" width="81" height="25" transform="rotate(-90 789.5 702.5)" stroke="white"/>
                            <g id="sensor_1">
                                <rect id="Rectangle 5_7" x="789.5" y="611.5" width="13" height="25" transform="rotate(-90 789.5 611.5)" stroke="white"/>
                                <rect id="Rectangle 19_7" x="789.5" y="569.5" width="13" height="25" transform="rotate(-90 789.5 569.5)" stroke="white"/>
                                <rect id="Rectangle 9_7" x="784.5" y="589" width="10" height="3" transform="rotate(-90 784.5 589)" stroke="white"/>
                                <rect id="Rectangle 6_7" x="787.5" y="620.5" width="9" height="29" rx="1.5" transform="rotate(-90 787.5 620.5)" stroke="white"/>
                                <rect id="Rectangle 7_7" x="787.5" y="556.5" width="9" height="29" rx="1.5" transform="rotate(-90 787.5 556.5)" stroke="white"/>
                                <rect id="Rectangle 8_7" x="787.5" y="598.5" width="29" height="29" rx="1.5" transform="rotate(-90 787.5 598.5)" stroke="white"/>
                                <circle id="Ellipse 1_7" cx="776" cy="584" r="9.5" transform="rotate(-90 776 584)" stroke="white"/>
                                <circle id="Ellipse 3_7" cx="776" cy="584" r="0.5" transform="rotate(-90 776 584)" stroke="white"/>
                                <path id="Ellipse 2_7" d="M781.303 589.303C780.254 590.352 778.918 591.067 777.463 591.356C776.008 591.645 774.5 591.497 773.13 590.929C771.759 590.361 770.588 589.4 769.764 588.167C768.94 586.933 768.5 585.483 768.5 584C768.5 582.517 768.94 581.067 769.764 579.833C770.588 578.6 771.759 577.639 773.13 577.071C774.5 576.503 776.008 576.355 777.463 576.644C778.918 576.933 780.254 577.648 781.303 578.697" stroke="white" stroke-linecap="round"/>
                                <line id="Line 1_7" x1="771.5" y1="584" x2="775.5" y2="584" stroke="white" stroke-linecap="round"/>
                            </g>
                            <g id="sensor_2">
                                <rect id="Rectangle 5_8" x="789.5" y="471.5" width="13" height="25" transform="rotate(-90 789.5 471.5)" stroke="white"/>
                                <rect id="Rectangle 19_8" x="789.5" y="429.5" width="13" height="25" transform="rotate(-90 789.5 429.5)" stroke="white"/>
                                <rect id="Rectangle 9_8" x="784.5" y="449" width="10" height="3" transform="rotate(-90 784.5 449)" stroke="white"/>
                                <rect id="Rectangle 6_8" x="787.5" y="480.5" width="9" height="29" rx="1.5" transform="rotate(-90 787.5 480.5)" stroke="white"/>
                                <rect id="Rectangle 7_8" x="787.5" y="416.5" width="9" height="29" rx="1.5" transform="rotate(-90 787.5 416.5)" stroke="white"/>
                                <rect id="Rectangle 8_8" x="787.5" y="458.5" width="29" height="29" rx="1.5" transform="rotate(-90 787.5 458.5)" stroke="white"/>
                                <circle id="Ellipse 1_8" cx="776" cy="444" r="9.5" transform="rotate(-90 776 444)" stroke="white"/>
                                <circle id="Ellipse 3_8" cx="776" cy="444" r="0.5" transform="rotate(-90 776 444)" stroke="white"/>
                                <path id="Ellipse 2_8" d="M781.303 449.303C780.254 450.352 778.918 451.067 777.463 451.356C776.008 451.645 774.5 451.497 773.13 450.929C771.759 450.361 770.588 449.4 769.764 448.167C768.94 446.933 768.5 445.483 768.5 444C768.5 442.517 768.94 441.067 769.764 439.833C770.588 438.6 771.759 437.639 773.13 437.071C774.5 436.503 776.008 436.355 777.463 436.644C778.918 436.933 780.254 437.648 781.303 438.697" stroke="white" stroke-linecap="round"/>
                                <line id="Line 1_8" x1="771.5" y1="444" x2="775.5" y2="444" stroke="white" stroke-linecap="round"/>
                            </g>
                            <g id="connector_4">
                                <rect id="Rectangle 11" x="21.5" y="241" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 241)" stroke="white"/>
                                <rect id="Rectangle 12" x="21.5" y="196.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 196.5)" stroke="white"/>
                                <rect id="Rectangle 20" x="57.5" y="200" width="9" height="29" rx="1.5" stroke="white"/>
                                <path id="Vector 1" d="M25.5 196.5V232H47.5V225.5H57.5V203.5H47.5V196.5H25.5Z" stroke="white"/>
                            </g>
                            <g id="connector_5">
                                <rect id="Rectangle 11_2" x="21.5" y="1166" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 1166)" stroke="white"/>
                                <rect id="Rectangle 12_2" x="21.5" y="1121.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 1121.5)" stroke="white"/>
                                <rect id="Rectangle 20_2" x="57.5" y="1125" width="9" height="29" rx="1.5" stroke="white"/>
                                <path id="Vector 1_2" d="M25.5 1121.5V1157H47.5V1150.5H57.5V1128.5H47.5V1121.5H25.5Z" stroke="white"/>
                            </g>
                            <g id="connector_12">
                                <rect id="Rectangle 11_3" x="605.5" y="1412" width="9" height="29" rx="1.5" transform="rotate(-90 605.5 1412)" stroke="white"/>
                                <rect id="Rectangle 12_3" x="605.5" y="1367.5" width="9" height="29" rx="1.5" transform="rotate(-90 605.5 1367.5)" stroke="white"/>
                                <rect id="Rectangle 20_3" x="641.5" y="1371" width="9" height="29" rx="1.5" stroke="white"/>
                                <path id="Vector 1_3" d="M609.5 1367.5V1403H631.5V1396.5H641.5V1374.5H631.5V1367.5H609.5Z" stroke="white"/>
                            </g>
                            <g id="connector_14">
                                <rect id="Rectangle 11_4" x="817.5" y="1113.5" width="9" height="29" rx="1.5" transform="rotate(90 817.5 1113.5)" stroke="white"/>
                                <rect id="Rectangle 12_4" x="817.5" y="1158" width="9" height="29" rx="1.5" transform="rotate(90 817.5 1158)" stroke="white"/>
                                <rect id="Rectangle 20_4" x="781.5" y="1154.5" width="9" height="29" rx="1.5" transform="rotate(-180 781.5 1154.5)" stroke="white"/>
                                <path id="Vector 1_4" d="M813.5 1158V1122.5H791.5V1129H781.5V1151H791.5V1158H813.5Z" stroke="white"/>
                            </g>
                            <g id="connector_7">
                                <rect id="Rectangle 11_5" x="172.5" y="1358.5" width="9" height="29" rx="1.5" transform="rotate(90 172.5 1358.5)" stroke="white"/>
                                <rect id="Rectangle 12_5" x="172.5" y="1403" width="9" height="29" rx="1.5" transform="rotate(90 172.5 1403)" stroke="white"/>
                                <rect id="Rectangle 20_5" x="136.5" y="1399.5" width="9" height="29" rx="1.5" transform="rotate(-180 136.5 1399.5)" stroke="white"/>
                                <path id="Vector 1_5" d="M168.5 1403V1367.5H146.5V1374H136.5V1396H146.5V1403H168.5Z" stroke="white"/>
                            </g>
                            <g id="connector_1">
                                <rect id="Rectangle 11_6" x="816.5" y="187.5" width="9" height="29" rx="1.5" transform="rotate(90 816.5 187.5)" stroke="white"/>
                                <rect id="Rectangle 12_6" x="816.5" y="232" width="9" height="29" rx="1.5" transform="rotate(90 816.5 232)" stroke="white"/>
                                <rect id="Rectangle 20_6" x="780.5" y="228.5" width="9" height="29" rx="1.5" transform="rotate(180 780.5 228.5)" stroke="white"/>
                                <path id="Vector 1_6" d="M812.5 232V196.5H790.5V203H780.5V225H790.5V232H812.5Z" stroke="white"/>
                            </g>
                            <g id="connector_3">
                                <rect id="Rectangle 17" x="54.5" y="21.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 20_7" x="50.5" y="55.5" width="9" height="29" rx="1.5" transform="rotate(90 50.5 55.5)" stroke="white"/>
                                <path id="Vector 2" d="M54.2676 24.9761C54.3522 24.9775 54.4299 24.9801 54.5 24.9819V45.9595C54.4351 45.9554 54.3652 45.9496 54.291 45.9458C53.8266 45.9218 53.1851 45.9058 52.4775 45.938C51.7713 45.9701 50.9878 46.0508 50.2451 46.2241C49.5075 46.3963 48.7772 46.6674 48.2002 47.1001C47.5598 47.5804 47.1791 48.4404 46.9385 49.3306C46.6918 50.2434 46.5645 51.2966 46.501 52.2808C46.4373 53.2682 46.4373 54.2052 46.4531 54.894C46.4585 55.1259 46.4675 55.3303 46.4746 55.4995H25.9395C25.9354 55.4644 25.9301 55.4274 25.9258 55.3882C25.8867 55.0355 25.8383 54.5174 25.8037 53.8638C25.7345 52.556 25.7188 50.7067 25.9346 48.5493C26.3665 44.2301 27.7224 38.7032 31.3994 33.8003C35.0401 28.946 40.894 26.7314 45.9092 25.7407C48.4085 25.247 50.6783 25.0613 52.3232 24.9995C53.1451 24.9686 53.8098 24.9684 54.2676 24.9761Z" stroke="white"/>
                            </g>
                            <g id="connector_2">
                                <rect id="Rectangle 17_2" x="816.5" y="54.5" width="9" height="29" rx="1.5" transform="rotate(90 816.5 54.5)" stroke="white"/>
                                <rect id="Rectangle 20_8" x="782.5" y="50.5" width="9" height="29" rx="1.5" transform="rotate(-180 782.5 50.5)" stroke="white"/>
                                <path id="Vector 2_2" d="M813.023 54.2678C813.022 54.3524 813.019 54.43 813.018 54.5002L792.04 54.5002C792.044 54.4353 792.05 54.3654 792.054 54.2912C792.078 53.8268 792.094 53.1852 792.062 52.4777C792.029 51.7715 791.949 50.988 791.775 50.2453C791.603 49.5077 791.332 48.7774 790.899 48.2004C790.419 47.5599 789.559 47.1793 788.669 46.9387C787.756 46.692 786.703 46.5646 785.719 46.5012C784.731 46.4375 783.794 46.4375 783.105 46.4533C782.874 46.4586 782.669 46.4677 782.5 46.4748L782.5 25.9396C782.535 25.9355 782.572 25.9303 782.611 25.926C782.964 25.8869 783.482 25.8385 784.136 25.8039C785.444 25.7347 787.293 25.719 789.45 25.9348C793.769 26.3667 799.296 27.7225 804.199 31.3996C809.053 35.0403 811.268 40.8942 812.259 45.9094C812.752 48.4087 812.938 50.6785 813 52.3234C813.031 53.1453 813.031 53.81 813.023 54.2678Z" stroke="white"/>
                            </g>
                            <g id="valve_10">
                                <rect id="Rectangle 10" x="644.5" y="202.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 19_9" x="686.5" y="202.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 11_7" x="635.5" y="200.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 12_7" x="699.5" y="200.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 13" x="657.5" y="200.5" width="29" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 15" x="659.5" y="188.5" width="25" height="3" rx="0.5" fill="#393939" stroke="white"/>
                                <line id="Line 4" x1="672" y1="192" x2="672" y2="198" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1" d="M663.863 191.625H680.137L672 198.352L663.863 191.625Z" stroke="white"/>
                                <rect id="Rectangle 14" x="667.5" y="197.5" width="9" height="3" stroke="white"/>
                            </g>
                            <g id="valve_1">
                                <rect id="Rectangle 10_2" x="790.5" y="153.5" width="13" height="25" transform="rotate(-90 790.5 153.5)" stroke="white"/>
                                <rect id="Rectangle 19_10" x="790.5" y="111.5" width="13" height="25" transform="rotate(-90 790.5 111.5)" stroke="white"/>
                                <rect id="Rectangle 11_8" x="788.5" y="162.5" width="9" height="29" rx="1.5" transform="rotate(-90 788.5 162.5)" stroke="white"/>
                                <rect id="Rectangle 12_8" x="788.5" y="98.5" width="9" height="29" rx="1.5" transform="rotate(-90 788.5 98.5)" stroke="white"/>
                                <rect id="Rectangle 13_2" x="788.5" y="140.5" width="29" height="29" rx="1.5" transform="rotate(-90 788.5 140.5)" stroke="white"/>
                                <rect id="Rectangle 15_2" x="776.5" y="138.5" width="25" height="3" rx="0.5" transform="rotate(-90 776.5 138.5)" fill="#393939" stroke="white"/>
                                <line id="Line 4_2" x1="780" y1="126" x2="786" y2="126" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1_2" d="M779.625 134.137V117.863L786.352 126L779.625 134.137Z" stroke="white"/>
                                <rect id="Rectangle 14_2" x="785.5" y="130.5" width="9" height="3" transform="rotate(-90 785.5 130.5)" stroke="white"/>
                            </g>
                            <g id="valve_6">
                                <rect id="Rectangle 10_3" x="209.5" y="1289.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 19_11" x="251.5" y="1289.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 11_9" x="200.5" y="1287.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 12_9" x="264.5" y="1287.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 13_3" x="222.5" y="1287.5" width="29" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 15_3" x="224.5" y="1275.5" width="25" height="3" rx="0.5" fill="#393939" stroke="white"/>
                                <line id="Line 4_3" x1="237" y1="1279" x2="237" y2="1285" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1_3" d="M228.863 1278.62H245.137L237 1285.35L228.863 1278.62Z" stroke="white"/>
                                <rect id="Rectangle 14_3" x="232.5" y="1284.5" width="9" height="3" stroke="white"/>
                            </g>
                            <g id="valve_8">
                                <rect id="Rectangle 10_4" x="500.5" y="1289.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 19_12" x="542.5" y="1289.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 11_10" x="491.5" y="1287.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 12_10" x="555.5" y="1287.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 13_4" x="513.5" y="1287.5" width="29" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 15_4" x="515.5" y="1275.5" width="25" height="3" rx="0.5" fill="#393939" stroke="white"/>
                                <line id="Line 4_4" x1="528" y1="1279" x2="528" y2="1285" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1_4" d="M519.863 1278.62H536.137L528 1285.35L519.863 1278.62Z" stroke="white"/>
                                <rect id="Rectangle 14_4" x="523.5" y="1284.5" width="9" height="3" stroke="white"/>
                            </g>
                            <g id="valve_9">
                                <rect id="Rectangle 10_5" x="790.5" y="1284.5" width="13" height="25" transform="rotate(-90 790.5 1284.5)" stroke="white"/>
                                <rect id="Rectangle 19_13" x="790.5" y="1242.5" width="13" height="25" transform="rotate(-90 790.5 1242.5)" stroke="white"/>
                                <rect id="Rectangle 11_11" x="788.5" y="1293.5" width="9" height="29" rx="1.5" transform="rotate(-90 788.5 1293.5)" stroke="white"/>
                                <rect id="Rectangle 12_11" x="788.5" y="1229.5" width="9" height="29" rx="1.5" transform="rotate(-90 788.5 1229.5)" stroke="white"/>
                                <rect id="Rectangle 13_5" x="788.5" y="1271.5" width="29" height="29" rx="1.5" transform="rotate(-90 788.5 1271.5)" stroke="white"/>
                                <rect id="Rectangle 15_5" x="776.5" y="1269.5" width="25" height="3" rx="0.5" transform="rotate(-90 776.5 1269.5)" fill="#393939" stroke="white"/>
                                <line id="Line 4_5" x1="780" y1="1257" x2="786" y2="1257" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1_5" d="M779.625 1265.14V1248.86L786.352 1257L779.625 1265.14Z" stroke="white"/>
                                <rect id="Rectangle 14_5" x="785.5" y="1261.5" width="9" height="3" transform="rotate(-90 785.5 1261.5)" stroke="white"/>
                            </g>
                            <g id="valve_7">
                                <rect id="Rectangle 10_6" x="501.5" y="1456.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 19_14" x="543.5" y="1456.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 11_12" x="492.5" y="1454.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 12_12" x="556.5" y="1454.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 13_6" x="514.5" y="1454.5" width="29" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 15_6" x="516.5" y="1442.5" width="25" height="3" rx="0.5" fill="#393939" stroke="white"/>
                                <line id="Line 4_6" x1="529" y1="1446" x2="529" y2="1452" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1_6" d="M520.863 1445.62H537.137L529 1452.35L520.863 1445.62Z" stroke="white"/>
                                <rect id="Rectangle 14_6" x="524.5" y="1451.5" width="9" height="3" stroke="white"/>
                            </g>
                            <g id="valve_11">
                                <rect id="Rectangle 10_7" x="127.5" y="1126.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 19_15" x="169.5" y="1126.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 11_13" x="118.5" y="1124.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 12_13" x="182.5" y="1124.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 13_7" x="140.5" y="1124.5" width="29" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 15_7" x="142.5" y="1112.5" width="25" height="3" rx="0.5" fill="#393939" stroke="white"/>
                                <line id="Line 4_7" x1="155" y1="1116" x2="155" y2="1122" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1_7" d="M146.863 1115.62H163.137L155 1122.35L146.863 1115.62Z" stroke="white"/>
                                <rect id="Rectangle 14_7" x="150.5" y="1121.5" width="9" height="3" stroke="white"/>
                            </g>
                            <g id="valve_4">
                                <rect id="Rectangle 10_8" x="23.5" y="1283.5" width="13" height="25" transform="rotate(-90 23.5 1283.5)" stroke="white"/>
                                <rect id="Rectangle 19_16" x="23.5" y="1241.5" width="13" height="25" transform="rotate(-90 23.5 1241.5)" stroke="white"/>
                                <rect id="Rectangle 11_14" x="21.5" y="1292.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 1292.5)" stroke="white"/>
                                <rect id="Rectangle 12_14" x="21.5" y="1228.5" width="9" height="29" rx="1.5" transform="rotate(-90 21.5 1228.5)" stroke="white"/>
                                <rect id="Rectangle 13_8" x="21.5" y="1270.5" width="29" height="29" rx="1.5" transform="rotate(-90 21.5 1270.5)" stroke="white"/>
                                <rect id="Rectangle 15_8" x="9.5" y="1268.5" width="25" height="3" rx="0.5" transform="rotate(-90 9.5 1268.5)" fill="#393939" stroke="white"/>
                                <line id="Line 4_8" x1="13" y1="1256" x2="19" y2="1256" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1_8" d="M12.625 1264.14V1247.86L19.3516 1256L12.625 1264.14Z" stroke="white"/>
                                <rect id="Rectangle 14_8" x="18.5" y="1260.5" width="9" height="3" transform="rotate(-90 18.5 1260.5)" stroke="white"/>
                            </g>
                            <g id="valve_5">
                                <rect id="Rectangle 10_9" x="210.5" y="1456.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 19_17" x="252.5" y="1456.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 11_15" x="201.5" y="1454.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 12_15" x="265.5" y="1454.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 13_9" x="223.5" y="1454.5" width="29" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 15_9" x="225.5" y="1442.5" width="25" height="3" rx="0.5" fill="#393939" stroke="white"/>
                                <line id="Line 4_9" x1="238" y1="1446" x2="238" y2="1452" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1_9" d="M229.863 1445.62H246.137L238 1452.35L229.863 1445.62Z" stroke="white"/>
                                <rect id="Rectangle 14_9" x="233.5" y="1451.5" width="9" height="3" stroke="white"/>
                            </g>
                            <rect id="pipe_5" x="815.5" y="63.5" width="26" height="25" transform="rotate(90 815.5 63.5)" stroke="white"/>
                            <rect id="pipe_4" x="814.5" y="162.5" width="25" height="25" transform="rotate(90 814.5 162.5)" stroke="white"/>
                            <g id="valve_2">
                                <rect id="Rectangle 10_10" x="23.5" y="154.044" width="12.776" height="25" transform="rotate(-90 23.5 154.044)" stroke="white"/>
                                <rect id="Rectangle 19_18" x="23.5" y="112.716" width="12.776" height="25" transform="rotate(-90 23.5 112.716)" stroke="white"/>
                                <rect id="Rectangle 11_16" x="21.5" y="162.9" width="8.84" height="29" rx="1.5" transform="rotate(-90 21.5 162.9)" stroke="white"/>
                                <rect id="Rectangle 12_16" x="21.5" y="99.924" width="8.84" height="29" rx="1.5" transform="rotate(-90 21.5 99.924)" stroke="white"/>
                                <rect id="Rectangle 13_10" x="21.5" y="141.252" width="28.52" height="29" rx="1.5" transform="rotate(-90 21.5 141.252)" stroke="white"/>
                                <rect id="Rectangle 15_10" x="9.5" y="139.284" width="24.584" height="3" rx="0.5" transform="rotate(-90 9.5 139.284)" fill="#393939" stroke="white"/>
                                <line id="Line 4_10" x1="13" y1="126.976" x2="19" y2="126.976" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1_10" d="M12.625 134.993V118.99L19.3477 126.991L12.625 134.993Z" stroke="white"/>
                                <rect id="Rectangle 14_10" x="18.5" y="131.412" width="8.84" height="3" transform="rotate(-90 18.5 131.412)" stroke="white"/>
                            </g>
                            <rect id="pipe_9" x="48.5" y="64.5" width="26" height="25" transform="rotate(90 48.5 64.5)" stroke="white"/>
                            <rect id="pipe_10" x="48.5" y="163.5" width="24" height="25" transform="rotate(90 48.5 163.5)" stroke="white"/>
                            <g id="valve_3">
                                <rect id="Rectangle 10_11" x="23.5" y="331.044" width="12.776" height="25" transform="rotate(-90 23.5 331.044)" stroke="white"/>
                                <rect id="Rectangle 19_19" x="23.5" y="289.716" width="12.776" height="25" transform="rotate(-90 23.5 289.716)" stroke="white"/>
                                <rect id="Rectangle 11_17" x="21.5" y="339.9" width="8.84" height="29" rx="1.5" transform="rotate(-90 21.5 339.9)" stroke="white"/>
                                <rect id="Rectangle 12_17" x="21.5" y="276.924" width="8.84" height="29" rx="1.5" transform="rotate(-90 21.5 276.924)" stroke="white"/>
                                <rect id="Rectangle 13_11" x="21.5" y="318.252" width="28.52" height="29" rx="1.5" transform="rotate(-90 21.5 318.252)" stroke="white"/>
                                <rect id="Rectangle 15_11" x="9.5" y="316.284" width="24.584" height="3" rx="0.5" transform="rotate(-90 9.5 316.284)" fill="#393939" stroke="white"/>
                                <line id="Line 4_11" x1="13" y1="303.976" x2="19" y2="303.976" stroke="white" stroke-width="2"/>
                                <path id="Polygon 1_11" d="M12.625 311.993V295.99L19.3477 303.991L12.625 311.993Z" stroke="white"/>
                                <rect id="Rectangle 14_11" x="18.5" y="308.412" width="8.84" height="3" transform="rotate(-90 18.5 308.412)" stroke="white"/>
                            </g>
                            <rect id="pipe_11" x="48.5" y="241.5" width="26" height="25" transform="rotate(90 48.5 241.5)" stroke="white"/>
                            <rect id="pipe_12" x="48.5" y="340.5" width="76" height="25" transform="rotate(90 48.5 340.5)" stroke="white"/>
                            <rect id="pipe_3" x="814.5" y="241.5" width="166" height="25" transform="rotate(90 814.5 241.5)" stroke="white"/>
                            <rect id="pipe_35" x="814.5" y="792.5" width="320" height="25" transform="rotate(90 814.5 792.5)" stroke="white"/>
                            <g id="pump_1">
                                <rect id="Rectangle 5_9" x="789.5" y="783.5" width="13" height="25" transform="rotate(-90 789.5 783.5)" stroke="white"/>
                                <rect id="Rectangle 28" x="789.5" y="741.5" width="30" height="25" transform="rotate(-90 789.5 741.5)" stroke="white"/>
                                <rect id="Rectangle 6_9" x="787.5" y="792.5" width="9" height="29" rx="1.5" transform="rotate(-90 787.5 792.5)" stroke="white"/>
                                <rect id="Rectangle 7_9" x="787.5" y="711.5" width="9" height="29" rx="1.5" transform="rotate(-90 787.5 711.5)" stroke="white"/>
                                <path id="Vector 3" d="M797.863 741.312H813C815.209 741.312 817 743.102 817 745.312V767.054C817 769.263 815.209 771.054 813 771.054H797.858C797.472 771.054 797.123 771.268 796.937 771.606C795.453 774.309 788.164 786 773.14 786C756.154 786 744.863 772.159 745.001 755.755C745.139 739.351 755.652 727.142 772.636 726.052C787.734 725.083 795.42 737.894 796.942 740.753C797.125 741.096 797.475 741.312 797.863 741.312Z" stroke="white"/>
                                <path id="Vector 4" d="M788.502 741.999V768.999C788.502 768.999 784.001 776.11 773.002 775.999C762.002 775.887 752.865 766.544 753.002 755.499C753.138 744.454 763.001 734.999 773.002 735.499C783.002 735.998 788.502 741.999 788.502 741.999Z" stroke="white"/>
                                <g id="Frame 2">
                                    <rect id="Rectangle 20_9" x="768.5" y="768" width="7" height="7" rx="1.5" transform="rotate(-90 768.5 768)" stroke="white"/>
                                    <rect id="Rectangle 21" x="768.5" y="759" width="7" height="7" rx="1.5" transform="rotate(-90 768.5 759)" stroke="white"/>
                                    <rect id="Rectangle 22" x="768.5" y="750" width="7" height="7" rx="1.5" transform="rotate(-90 768.5 750)" stroke="white"/>
                                </g>
                            </g>
                            <g id="tank_1">
                                <rect id="Rectangle 5_10" x="342.5" y="1456.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 19_20" x="424.5" y="1456.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 6_10" x="333.5" y="1454.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 7_10" x="437.5" y="1454.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <path id="Rectangle 20_10" d="M357 1447C357 1445.9 357.895 1445 359 1445H421C422.105 1445 423 1445.9 423 1447V1489C423 1489.55 422.552 1490 422 1490H358C357.448 1490 357 1489.55 357 1489V1447Z" fill="#281ACB"/>
                                <path id="Subtract" d="M423 1432C424.105 1432 425 1432.9 425 1434V1490L424.989 1490.2C424.894 1491.15 424.146 1491.89 423.204 1491.99L423 1492H357L356.796 1491.99C355.854 1491.89 355.106 1491.15 355.011 1490.2L355 1490V1434C355 1432.9 355.895 1432 357 1432V1433C356.448 1433 356 1433.45 356 1434V1490C356 1490.55 356.448 1491 357 1491H423C423.552 1491 424 1490.55 424 1490V1434C424 1433.45 423.552 1433 423 1433V1432Z" fill="white"/>
                            </g>
                            <g id="tank_2">
                                <rect id="Rectangle 5_11" x="341.5" y="1289.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 19_21" x="423.5" y="1289.5" width="13" height="25" stroke="white"/>
                                <rect id="Rectangle 6_11" x="332.5" y="1287.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 7_11" x="436.5" y="1287.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <path id="Rectangle 20_11" d="M356 1280C356 1278.9 356.895 1278 358 1278H420C421.105 1278 422 1278.9 422 1280V1322C422 1322.55 421.552 1323 421 1323H357C356.448 1323 356 1322.55 356 1322V1280Z" fill="#281ACB"/>
                                <path id="Subtract_2" d="M422 1265C423.105 1265 424 1265.9 424 1267V1323L423.989 1323.2C423.894 1324.15 423.146 1324.89 422.204 1324.99L422 1325H356L355.796 1324.99C354.854 1324.89 354.106 1324.15 354.011 1323.2L354 1323V1267C354 1265.9 354.895 1265 356 1265V1266C355.448 1266 355 1266.45 355 1267V1323C355 1323.55 355.448 1324 356 1324H422C422.552 1324 423 1323.55 423 1323V1267C423 1266.45 422.552 1266 422 1266V1265Z" fill="white"/>
                            </g>
                            <g id="pipe_27">
                                <rect id="Rectangle 30_2" x="445.5" y="1289.5" width="46" height="25" stroke="white"/>
                            </g>
                            <g id="pipe_32">
                                <rect id="Rectangle 30_3" x="650.5" y="1372.5" width="126" height="25" stroke="white"/>
                            </g>
                            <g id="pipe_31">
                                <rect id="Rectangle 30_4" x="607.5" y="1358.5" width="28" height="25" transform="rotate(-90 607.5 1358.5)" stroke="white"/>
                            </g>
                            <g id="pipe_30">
                                <rect id="Rectangle 30_5" x="607.5" y="1440.5" width="28" height="25" transform="rotate(-90 607.5 1440.5)" stroke="white"/>
                            </g>
                            <g id="pipe_29">
                                <rect id="Rectangle 30_6" x="565.5" y="1289.5" width="25" height="25" stroke="white"/>
                            </g>
                            <g id="pipe_28">
                                <rect id="Rectangle 30_7" x="565.5" y="1456.5" width="26" height="25" stroke="white"/>
                            </g>
                            <g id="pipe_26">
                                <rect id="Rectangle 30_8" x="446.5" y="1456.5" width="46" height="25" stroke="white"/>
                            </g>
                            <g id="pipe_25">
                                <rect id="Rectangle 30_9" x="273.5" y="1289.5" width="59" height="25" stroke="white"/>
                            </g>
                            <g id="pipe_23">
                                <rect id="Rectangle 30_10" x="185.5" y="1289.5" width="15" height="25" stroke="white"/>
                            </g>
                            <g id="pipe_19">
                                <rect id="Rectangle 30_11" x="65.5" y="1372.5" width="62" height="25" stroke="white"/>
                            </g>
                            <g id="pipe_22">
                                <rect id="Rectangle 30_12" x="186.5" y="1456.5" width="15" height="25" stroke="white"/>
                            </g>
                            <g id="pipe_21">
                                <rect id="Rectangle 30_13" x="145.5" y="1358.5" width="28" height="25" transform="rotate(-90 145.5 1358.5)" stroke="white"/>
                            </g>
                            <g id="pipe_20">
                                <rect id="Rectangle 30_14" x="145.5" y="1442.5" width="30" height="25" transform="rotate(-90 145.5 1442.5)" stroke="white"/>
                            </g>
                            <g id="pipe_24">
                                <rect id="Rectangle 30_15" x="274.5" y="1456.5" width="59" height="25" stroke="white"/>
                            </g>
                            <g id="connector_9">
                                <rect id="Rectangle 17_3" x="176.5" y="1287.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <rect id="Rectangle 20_12" x="172.5" y="1321.5" width="9" height="29" rx="1.5" transform="rotate(90 172.5 1321.5)" stroke="white"/>
                                <path id="Vector 2_3" d="M176.268 1290.98C176.352 1290.98 176.43 1290.98 176.5 1290.98V1311.96C176.435 1311.96 176.365 1311.95 176.291 1311.95C175.827 1311.92 175.185 1311.91 174.478 1311.94C173.771 1311.97 172.988 1312.05 172.245 1312.22C171.508 1312.4 170.777 1312.67 170.2 1313.1C169.56 1313.58 169.179 1314.44 168.938 1315.33C168.692 1316.24 168.564 1317.3 168.501 1318.28C168.437 1319.27 168.437 1320.21 168.453 1320.89C168.458 1321.13 168.467 1321.33 168.475 1321.5H147.939C147.935 1321.46 147.93 1321.43 147.926 1321.39C147.887 1321.04 147.838 1320.52 147.804 1319.86C147.734 1318.56 147.719 1316.71 147.935 1314.55C148.367 1310.23 149.722 1304.7 153.399 1299.8C157.04 1294.95 162.894 1292.73 167.909 1291.74C170.409 1291.25 172.678 1291.06 174.323 1291C175.145 1290.97 175.81 1290.97 176.268 1290.98Z" stroke="white"/>
                            </g>
                            <g id="connector_11">
                                <rect id="Rectangle 17_4" x="633.5" y="1320.5" width="9" height="29" rx="1.5" transform="rotate(90 633.5 1320.5)" stroke="white"/>
                                <rect id="Rectangle 20_13" x="599.5" y="1316.5" width="9" height="29" rx="1.5" transform="rotate(-180 599.5 1316.5)" stroke="white"/>
                                <path id="Vector 2_4" d="M630.023 1320.27C630.022 1320.35 630.019 1320.43 630.018 1320.5H609.04C609.044 1320.44 609.05 1320.37 609.054 1320.29C609.078 1319.83 609.094 1319.19 609.062 1318.48C609.029 1317.77 608.949 1316.99 608.775 1316.25C608.603 1315.51 608.332 1314.78 607.899 1314.2C607.419 1313.56 606.559 1313.18 605.669 1312.94C604.756 1312.69 603.703 1312.56 602.719 1312.5C601.731 1312.44 600.794 1312.44 600.105 1312.45C599.874 1312.46 599.669 1312.47 599.5 1312.47V1291.94C599.535 1291.94 599.572 1291.93 599.611 1291.93C599.964 1291.89 600.482 1291.84 601.136 1291.8C602.444 1291.73 604.293 1291.72 606.45 1291.93C610.769 1292.37 616.296 1293.72 621.199 1297.4C626.053 1301.04 628.268 1306.89 629.259 1311.91C629.752 1314.41 629.938 1316.68 630 1318.32C630.031 1319.15 630.031 1319.81 630.023 1320.27Z" stroke="white"/>
                            </g>
                            <g id="connector_10">
                                <rect id="Rectangle 17_5" x="601.5" y="1483.5" width="9" height="29" rx="1.5" transform="rotate(-180 601.5 1483.5)" stroke="white"/>
                                <rect id="Rectangle 20_14" x="605.5" y="1449.5" width="9" height="29" rx="1.5" transform="rotate(-90 605.5 1449.5)" stroke="white"/>
                                <path id="Vector 2_5" d="M601.732 1480.02C601.648 1480.02 601.57 1480.02 601.5 1480.02V1459.04C601.565 1459.04 601.635 1459.05 601.709 1459.05C602.173 1459.08 602.815 1459.09 603.522 1459.06C604.229 1459.03 605.012 1458.95 605.755 1458.78C606.492 1458.6 607.223 1458.33 607.8 1457.9C608.44 1457.42 608.821 1456.56 609.062 1455.67C609.308 1454.76 609.436 1453.7 609.499 1452.72C609.563 1451.73 609.563 1450.79 609.547 1450.11C609.542 1449.87 609.533 1449.67 609.525 1449.5H630.061C630.065 1449.54 630.07 1449.57 630.074 1449.61C630.113 1449.96 630.162 1450.48 630.196 1451.14C630.266 1452.44 630.281 1454.29 630.065 1456.45C629.633 1460.77 628.278 1466.3 624.601 1471.2C620.96 1476.05 615.106 1478.27 610.091 1479.26C607.591 1479.75 605.322 1479.94 603.677 1480C602.855 1480.03 602.19 1480.03 601.732 1480.02Z" stroke="white"/>
                            </g>
                            <g id="connector_13">
                                <rect id="Rectangle 17_6" x="785.5" y="1398.5" width="9" height="29" rx="1.5" transform="rotate(-180 785.5 1398.5)" stroke="white"/>
                                <rect id="Rectangle 20_15" x="789.5" y="1364.5" width="9" height="29" rx="1.5" transform="rotate(-90 789.5 1364.5)" stroke="white"/>
                                <path id="Vector 2_6" d="M785.732 1395.02C785.648 1395.02 785.57 1395.02 785.5 1395.02V1374.04C785.565 1374.04 785.635 1374.05 785.709 1374.05C786.173 1374.08 786.815 1374.09 787.522 1374.06C788.229 1374.03 789.012 1373.95 789.755 1373.78C790.492 1373.6 791.223 1373.33 791.8 1372.9C792.44 1372.42 792.821 1371.56 793.062 1370.67C793.308 1369.76 793.436 1368.7 793.499 1367.72C793.563 1366.73 793.563 1365.79 793.547 1365.11C793.542 1364.87 793.533 1364.67 793.525 1364.5H814.061C814.065 1364.54 814.07 1364.57 814.074 1364.61C814.113 1364.96 814.162 1365.48 814.196 1366.14C814.266 1367.44 814.281 1369.29 814.065 1371.45C813.633 1375.77 812.278 1381.3 808.601 1386.2C804.96 1391.05 799.106 1393.27 794.091 1394.26C791.591 1394.75 789.322 1394.94 787.677 1395C786.855 1395.03 786.19 1395.03 785.732 1395.02Z" stroke="white"/>
                            </g>
                            <g id="connector_6">
                                <rect id="Rectangle 17_7" x="22.5" y="1366.5" width="9" height="29" rx="1.5" transform="rotate(-90 22.5 1366.5)" stroke="white"/>
                                <rect id="Rectangle 20_16" x="56.5" y="1370.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <path id="Vector 2_7" d="M25.9766 1366.73C25.978 1366.65 25.9806 1366.57 25.9824 1366.5H46.96C46.9559 1366.56 46.9501 1366.63 46.9463 1366.71C46.9223 1367.17 46.9063 1367.81 46.9385 1368.52C46.9706 1369.23 47.0513 1370.01 47.2246 1370.75C47.3968 1371.49 47.6679 1372.22 48.1006 1372.8C48.5809 1373.44 49.4409 1373.82 50.3311 1374.06C51.2438 1374.31 52.2971 1374.44 53.2812 1374.5C54.2687 1374.56 55.2057 1374.56 55.8945 1374.55C56.1264 1374.54 56.3308 1374.53 56.5 1374.53V1395.06C56.4649 1395.06 56.4279 1395.07 56.3887 1395.07C56.036 1395.11 55.5179 1395.16 54.8643 1395.2C53.5565 1395.27 51.7072 1395.28 49.5498 1395.07C45.2305 1394.63 39.7037 1393.28 34.8008 1389.6C29.9465 1385.96 27.7319 1380.11 26.7412 1375.09C26.2475 1372.59 26.0618 1370.32 26 1368.68C25.9691 1367.85 25.9689 1367.19 25.9766 1366.73Z" stroke="white"/>
                            </g>
                            <g id="connector_8">
                                <rect id="Rectangle 17_8" x="143.5" y="1451.5" width="9" height="29" rx="1.5" transform="rotate(-90 143.5 1451.5)" stroke="white"/>
                                <rect id="Rectangle 20_17" x="177.5" y="1455.5" width="9" height="29" rx="1.5" stroke="white"/>
                                <path id="Vector 2_8" d="M146.977 1451.73C146.978 1451.65 146.981 1451.57 146.982 1451.5H167.96C167.956 1451.56 167.95 1451.63 167.946 1451.71C167.922 1452.17 167.906 1452.81 167.938 1453.52C167.971 1454.23 168.051 1455.01 168.225 1455.75C168.397 1456.49 168.668 1457.22 169.101 1457.8C169.581 1458.44 170.441 1458.82 171.331 1459.06C172.244 1459.31 173.297 1459.44 174.281 1459.5C175.269 1459.56 176.206 1459.56 176.895 1459.55C177.126 1459.54 177.331 1459.53 177.5 1459.53V1480.06C177.465 1480.06 177.428 1480.07 177.389 1480.07C177.036 1480.11 176.518 1480.16 175.864 1480.2C174.556 1480.27 172.707 1480.28 170.55 1480.07C166.231 1479.63 160.704 1478.28 155.801 1474.6C150.947 1470.96 148.732 1465.11 147.741 1460.09C147.248 1457.59 147.062 1455.32 147 1453.68C146.969 1452.85 146.969 1452.19 146.977 1451.73Z" stroke="white"/>
                            </g>
                        </g>
                    </svg>
            </div>

            {tip.open && tooltipData && (
                <div
                    className="pointer-events-none absolute z-50 rounded-xl border border-white/15 bg-zinc-950/95 px-3 py-2 text-xs text-white/90 shadow-lg"
                    style={{ left: tip.x, top: tip.y }}
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
