import { Types } from "mongoose";

export interface INotification {
    sender: Types.ObjectId; // performer of action
    group: Types.ObjectId; // group where the action occurred
    title: string;
    message: string;
    type: "BAZAR" | "BILL" | "GROUP" | "SYSTEM";
    readBy: Types.ObjectId[];
    deletedBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
