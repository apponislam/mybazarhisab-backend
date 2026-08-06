import mongoose, { Schema } from "mongoose";
import crypto from "crypto";
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
groupSchema.index({ members: 1, isDeleted: 1 });
groupSchema.index({ creator: 1, isDeleted: 1 });

// Helper function to generate clean 6-character uppercase alphanumeric code
const generateCleanInviteCode = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded confusing chars like 0, O, 1, I
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Pre-save hook to generate unique invite code
groupSchema.pre("save", async function () {
    if (!this.inviteCode) {
        let code = generateCleanInviteCode();
        let codeExists = await mongoose.models.Group.findOne({ inviteCode: code });
        while (codeExists) {
            code = generateCleanInviteCode();
            codeExists = await mongoose.models.Group.findOne({ inviteCode: code });
        }
        this.inviteCode = code;
    }
});

export const GroupModel = mongoose.model<Group>("Group", groupSchema);
