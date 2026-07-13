import { Types } from "mongoose";

export interface Feedback {
    user: Types.ObjectId;
    rating: number;
    comment: string;
    isPublic: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
