import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Company } from "@/models/Company";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const companies = await Company.find({ isDeleted: { $ne: true } }).sort({ name: 1 }).lean();
        return NextResponse.json(companies);
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== "Super Admin")
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });

        const data = await req.json();
        if (!data.name?.trim())
            return NextResponse.json({ message: "Name is required" }, { status: 400 });

        await dbConnect();
        const company = await Company.create({ ...data, creatorId: session.user.id });
        return NextResponse.json(company, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
    }
}