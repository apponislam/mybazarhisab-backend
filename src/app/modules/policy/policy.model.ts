import mongoose, { Schema } from "mongoose";
import { IPolicy } from "./policy.interface";

const policySchema = new Schema<IPolicy>(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        type: {
            type: String,
            enum: ["terms", "privacy"],
            required: [true, "Type is required"],
            unique: true,
        },
        content: {
            type: String,
            required: [true, "Content is required"],
        },
        version: {
            type: String,
            default: "1.0",
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const PolicyModel = mongoose.model<IPolicy>("Policy", policySchema);
