import { Types } from "mongoose";

export type TFeedbackCategory = "BUG" | "FEATURE_REQUEST" | "UI_UX" | "GENERAL";
export type TFeedbackStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

export interface Feedback {
    user: Types.ObjectId;
    category: TFeedbackCategory;
    subject: string;
    message: string;
    status: TFeedbackStatus;
    adminNote?: string;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
