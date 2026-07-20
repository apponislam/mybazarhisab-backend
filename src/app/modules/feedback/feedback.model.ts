import mongoose, { Schema } from "mongoose";
import { Feedback } from "./feedback.interface";

const feedbackSchema = new Schema<Feedback>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        category: {
            type: String,
            enum: ["BUG", "FEATURE_REQUEST", "UI_UX", "GENERAL"],
            default: "GENERAL",
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"],
            default: "PENDING",
        },
        adminNote: {
            type: String,
            trim: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

feedbackSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
feedbackSchema.index({ user: 1, isDeleted: 1 });

export const FeedbackModel = mongoose.model<Feedback>("Feedback", feedbackSchema);
