import mongoose, { Schema } from "mongoose";
import { Feedback } from "./feedback.interface";

const feedbackSchema = new Schema<Feedback>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
        },
        comment: {
            type: String,
            required: [true, "Comment is required"],
            trim: true,
        },
        isPublic: {
            type: Boolean,
            default: false,
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

// Indexes for pagination and reviews querying
feedbackSchema.index({ isPublic: 1, isDeleted: 1, createdAt: -1 });
feedbackSchema.index({ user: 1, isDeleted: 1 });

export const FeedbackModel = mongoose.model<Feedback>("Feedback", feedbackSchema);
