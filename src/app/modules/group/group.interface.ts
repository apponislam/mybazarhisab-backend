import { Types } from "mongoose";

export interface Group {
    name: string;
    creator: Types.ObjectId;
    members: Types.ObjectId[];
    inviteCode: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
