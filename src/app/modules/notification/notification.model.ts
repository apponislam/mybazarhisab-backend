import mongoose, { Schema } from "mongoose";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Sender User ID is required"],
        },
        group: {
            type: Schema.Types.ObjectId,
            ref: "Group",
            required: [true, "Group ID is required"],
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
        },
        type: {
            type: String,
            enum: ["BAZAR", "BILL", "GROUP", "SYSTEM"],
            required: [true, "Notification type is required"],
        },
        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        deletedBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexing for performance
notificationSchema.index({ group: 1, deletedBy: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>("Notification", notificationSchema);
