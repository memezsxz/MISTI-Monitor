export const runtime = "nodejs";

import {NextResponse} from "next/server";
import {getFailureFlowData} from "@/lib/failureTree";

export async function GET() {
    try {
        const data = await getFailureFlowData();
        return NextResponse.json(data, {status: 200});
    } catch (error) {
        console.error("Failed to load failure tree", error);
        return NextResponse.json({error: "Failed to load failure tree"}, {status: 500});
    }
}
