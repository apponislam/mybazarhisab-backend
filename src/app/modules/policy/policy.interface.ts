import { Types } from "mongoose";

export type TPolicyType = "terms" | "privacy";

export interface IPolicy {
    title: string;
    type: TPolicyType;
    content: string;
    version?: string;
    isPublished: boolean;
    updatedBy?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
