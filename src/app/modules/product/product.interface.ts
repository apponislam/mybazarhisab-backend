import { Types } from "mongoose";

export interface Product {
    name: string;
    price: number;
    unit: string;
    category?: string;
    description?: string;
    user: Types.ObjectId;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
