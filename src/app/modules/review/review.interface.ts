import { Types } from "mongoose";

export interface IReview {
    user: Types.ObjectId;
    rating: number;
    comment: string;
    isPublic: boolean;
    isDeleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
