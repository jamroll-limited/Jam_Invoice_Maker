import mongoose, { Schema } from "mongoose";

const clientSchema = new Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    // NEW — Your Company (From) info (issuer)
    from: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    // NEW — bank / payment details
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
    branch: { type: String, default: "" },
    swift: { type: String, default: "" },
    routingNumber: { type: String, default: "" },

    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

delete (mongoose.models as any).Client;
export const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);