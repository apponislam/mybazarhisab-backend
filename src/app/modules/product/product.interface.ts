import { Types } from "mongoose";

export interface Product {
    name: string;
    photo?: string;
    is18Plus?: boolean;
    description?: string;
    user: Types.ObjectId;
    isEdited?: boolean;
    updatedBy?: Types.ObjectId;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
