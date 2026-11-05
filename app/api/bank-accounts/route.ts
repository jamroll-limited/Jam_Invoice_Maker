import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { BankAccount } from "@/models/BankAccount";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const items = await BankAccount.find({ isDeleted: { $ne: true } }).sort({ label: 1 }).lean();
        return NextResponse.json(items);
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
        if (!data.label?.trim())
            return NextResponse.json({ message: "Label is required" }, { status: 400 });

        await dbConnect();
        const item = await BankAccount.create({ ...data, creatorId: session.user.id });
        return NextResponse.json(item, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
    }
}