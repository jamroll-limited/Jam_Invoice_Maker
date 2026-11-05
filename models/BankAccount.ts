import mongoose, { Schema } from "mongoose";

const bankAccountSchema = new Schema(
    {
        label: { type: String, required: true },
        accountName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        bankName: { type: String, default: "" },
        branch: { type: String, default: "" },
        swift: { type: String, default: "" },
        routingNumber: { type: String, default: "" },
        currency: { type: String, default: "BDT" },
        note: { type: String, default: "" },
        creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date },
    },
    { timestamps: true }
);

delete (mongoose.models as any).BankAccount;
export const BankAccount = mongoose.models.BankAccount || mongoose.model("BankAccount", bankAccountSchema);