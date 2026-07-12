import { Types } from "mongoose";

export enum ActivityType {
    REGISTER = "REGISTER",
    LOGIN = "LOGIN",
    EMAIL_VERIFY = "EMAIL_VERIFY",
    PASSWORD_RESET = "PASSWORD_RESET",
    PROFILE_UPDATE = "PROFILE_UPDATE",
    PASSWORD_CHANGE = "PASSWORD_CHANGE",
    EMAIL_UPDATE = "EMAIL_UPDATE",
    USER_DELETE = "USER_DELETE",
    CREATE_PRODUCT = "CREATE_PRODUCT",
    UPDATE_PRODUCT = "UPDATE_PRODUCT",
    DELETE_PRODUCT = "DELETE_PRODUCT",
    MERGE_PRODUCTS = "MERGE_PRODUCTS",
    CREATE_BAZAR_ENTRY = "CREATE_BAZAR_ENTRY",
    UPDATE_BAZAR_ENTRY = "UPDATE_BAZAR_ENTRY",
    DELETE_BAZAR_ENTRY = "DELETE_BAZAR_ENTRY",
    CREATE_GROUP = "CREATE_GROUP",
    JOIN_GROUP = "JOIN_GROUP",
    LEAVE_GROUP = "LEAVE_GROUP",
    CREATE_BILL = "CREATE_BILL",
    UPDATE_BILL = "UPDATE_BILL",
    DELETE_BILL = "DELETE_BILL",
}

export interface Activity {
    user: Types.ObjectId;
    group?: Types.ObjectId;
    action: ActivityType;
    details: string;
    metadata?: Record<string, any>;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
