import { Types } from "mongoose";

export interface Activity {
    user: Types.ObjectId;
    group?: Types.ObjectId;
    action: string;
    details: string;
    metadata?: Record<string, any>;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
