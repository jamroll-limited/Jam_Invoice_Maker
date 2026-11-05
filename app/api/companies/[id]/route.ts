import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongoose";
import { Company } from "@/models/Company";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Super Admin")
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });

        const { id } = await params;
        const data = await req.json();
        await dbConnect();
        const company = await Company.findByIdAndUpdate(id, data, { new: true });
        if (!company) return NextResponse.json({ message: "Not found" }, { status: 404 });
        return NextResponse.json(company);
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Super Admin")
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });

        const { id } = await params;
        await dbConnect();

        const { searchParams } = new URL(req.url);
        if (searchParams.get("permanent") === "true") {
            const c = await Company.findByIdAndDelete(id);
            if (!c) return NextResponse.json({ message: "Not found" }, { status: 404 });
            return NextResponse.json({ message: "Permanently deleted" });
        }

        const c = await Company.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if (!c) return NextResponse.json({ message: "Not found" }, { status: 404 });
        return NextResponse.json({ message: "Moved to trash" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
    }
}