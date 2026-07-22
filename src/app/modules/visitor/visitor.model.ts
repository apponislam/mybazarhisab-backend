import mongoose, { Schema } from "mongoose";
import { IVisitor } from "./visitor.interface";

const visitorSchema = new Schema<IVisitor>(
    {
        ipAddress: {
            type: String,
            required: true,
            trim: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        userAgent: {
            type: String,
            default: "",
        },
        platform: {
            type: String,
            enum: ["WEB", "ANDROID", "IOS", "APP"],
            default: "WEB",
        },
        path: {
            type: String,
            default: "/",
        },
        date: {
            type: String,
            required: true,
            index: true,
        },
        count: {
            type: Number,
            default: 1,
        },
        lastVisitedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Compound index to quickly find/upsert daily visits by IP, Date & Platform
visitorSchema.index({ date: 1, ipAddress: 1, platform: 1 }, { unique: true });
// visitorSchema.index({ date: 1 });
visitorSchema.index({ platform: 1 });

export const VisitorModel = mongoose.model<IVisitor>("Visitor", visitorSchema);
