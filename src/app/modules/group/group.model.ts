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
groupSchema.index({ inviteCode: 1 }, { unique: true });
groupSchema.index({ members: 1, isDeleted: 1 });
groupSchema.index({ creator: 1, isDeleted: 1 });

// Pre-save hook to generate unique invite code
groupSchema.pre("save", async function () {
    if (!this.inviteCode) {
        let code = "BAZAR-" + crypto.randomBytes(3).toString("hex").toUpperCase();
        let codeExists = await mongoose.models.Group.findOne({ inviteCode: code });
        while (codeExists) {
            code = "BAZAR-" + crypto.randomBytes(3).toString("hex").toUpperCase();
            codeExists = await mongoose.models.Group.findOne({ inviteCode: code });
        }
        this.inviteCode = code;
    }
});

export const GroupModel = mongoose.model<Group>("Group", groupSchema);
