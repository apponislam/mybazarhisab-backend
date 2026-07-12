import mongoose, { Schema } from "mongoose";
import { Product } from "./product.interface";

const productSchema = new Schema<Product>(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },

        unit: {
            type: String,
            required: [true, "Unit of measurement is required"],
            enum: ["KG", "LITER", "PIECE", "GM"],
            trim: true,
        },

        photo: {
            type: String,
            trim: true,
        },
        is18Plus: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String,
            trim: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes for faster lookups
productSchema.index({ user: 1, isDeleted: 1 });
productSchema.index({ name: 1 });


export const ProductModel = mongoose.model<Product>("Product", productSchema);
