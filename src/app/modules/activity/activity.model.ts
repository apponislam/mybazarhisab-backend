import mongoose, { Schema } from "mongoose";
import { Activity } from "./activity.interface";

const activitySchema = new Schema<Activity>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        group: {
            type: Schema.Types.ObjectId,
            ref: "Group",
        },
        action: {
            type: String,
            required: [true, "Action is required"],
        },
        details: {
            type: String,
            required: [true, "Details is required"],
        },
        metadata: {
            type: Schema.Types.Mixed,
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

// Compound indexes for optimal sorting/querying
activitySchema.index({ group: 1, isDeleted: 1, createdAt: -1 });
activitySchema.index({ user: 1, isDeleted: 1, createdAt: -1 });

export const ActivityModel = mongoose.model<Activity>("Activity", activitySchema);
