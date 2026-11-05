import mongoose, { Schema } from "mongoose";

const companySchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        address: { type: String, default: "" },
        creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date },
    },
    { timestamps: true }
);

delete (mongoose.models as any).Company;
export const Company = mongoose.models.Company || mongoose.model("Company", companySchema);