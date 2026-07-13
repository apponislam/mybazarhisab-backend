import mongoose, { Schema } from "mongoose";
import { Contact } from "./contact.interface";

const contactSchema = new Schema<Contact>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
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
        isRead: {
            type: Boolean,
            default: false,
        },
        isReplied: {
            type: Boolean,
            default: false,
        },
        replyMessage: {
            type: String,
            trim: true,
        },
        repliedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
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

// Indexes for searching and sorting contact form submissions
contactSchema.index({ email: 1, name: 1 });
contactSchema.index({ isDeleted: 1, createdAt: -1 });

export const ContactModel = mongoose.model<Contact>("Contact", contactSchema);
