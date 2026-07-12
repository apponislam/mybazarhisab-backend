import mongoose, { Schema } from "mongoose";
import { Group } from "./group.interface";

const groupSchema = new Schema<Group>(
    {
        name: {
            type: String,
            required: [true, "Group name is required"],
            trim: true,
        },
        creator: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Creator ID is required"],
        },
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        inviteCode: {
            type: String,
            required: [true, "Invite code is required"],
            unique: true,
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

// Indexes
groupSchema.index({ inviteCode: 1 }, { unique: true });

export const GroupModel = mongoose.model<Group>("Group", groupSchema);
