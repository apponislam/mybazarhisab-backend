import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiError";
import { Contact } from "./contact.interface";
import { ContactModel } from "./contact.model";
import { sendContactReplyEmail } from "../../../utils/emailTemplates";

const submitMessage = async (payload: Partial<Contact>) => {
    return await ContactModel.create(payload);
};

const getAllMessages = async (query: {
    searchTerm?: string;
    isRead?: string;
    isReplied?: string;
    page?: string;
    limit?: string;
}) => {
    const { searchTerm, isRead, isReplied, page = 1, limit = 10 } = query;

    const filter: any = { isDeleted: false };

    if (searchTerm) {
        filter.$or = [
            { name: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { subject: { $regex: searchTerm, $options: "i" } },
            { message: { $regex: searchTerm, $options: "i" } },
        ];
    }

    if (isRead !== undefined) {
        filter.isRead = isRead === "true";
    }

    if (isReplied !== undefined) {
        filter.isReplied = isReplied === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);
    const messages = await ContactModel.find(filter)
        .populate("repliedBy", "name email phone profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await ContactModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
        },
        data: messages,
    };
};

const getMessageById = async (id: string) => {
    const contact = await ContactModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isRead: true } },
        { new: true }
    ).populate("repliedBy", "name email phone profileImage");

    if (!contact) {
        throw new ApiError(httpStatus.NOT_FOUND, "Submission message not found");
    }

    return contact;
};

const replyToMessage = async (id: string, repliedBy: string, replyMessage: string) => {
    const contact = await ContactModel.findOne({ _id: id, isDeleted: false });
    if (!contact) {
        throw new ApiError(httpStatus.NOT_FOUND, "Submission message not found");
    }

    contact.replyMessage = replyMessage;
    contact.isReplied = true;
    contact.repliedBy = new mongoose.Types.ObjectId(repliedBy);
    await contact.save();

    // Dispatch response email via central template utility
    sendContactReplyEmail(
        contact.email,
        contact.name,
        contact.subject,
        contact.message,
        replyMessage
    );

    return contact;
};

const deleteMessage = async (id: string) => {
    const contact = await ContactModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: { isDeleted: true } },
        { new: true }
    );

    if (!contact) {
        throw new ApiError(httpStatus.NOT_FOUND, "Submission message not found");
    }

    return contact;
};

export const contactServices = {
    submitMessage,
    getAllMessages,
    getMessageById,
    replyToMessage,
    deleteMessage,
};
