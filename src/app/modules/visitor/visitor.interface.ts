import { Types } from "mongoose";

export interface IVisitor {
    _id?: Types.ObjectId;
    ipAddress: string;
    userId?: Types.ObjectId;
    userAgent?: string;
    path?: string;
    date: string; // YYYY-MM-DD format for easy daily aggregation
    count: number;
    lastVisitedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
