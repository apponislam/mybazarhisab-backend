import { Types } from "mongoose";

export interface Contact {
    name: string;
    email: string;
    subject: string;
    message: string;
    isRead: boolean;
    isReplied: boolean;
    replyMessage?: string;
    repliedBy?: Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
