import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiError";
import { Contact } from "./contact.interface";
import { ContactModel } from "./contact.model";
import { sendMail } from "../../../utils/nodemailer";

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

    // Prepare and dispatch response email via SMTP
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
            <div style="text-align: center; border-bottom: 2px solid #edf2f7; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: #2d3748; margin: 0; font-size: 22px; font-weight: 700;">Bazar Hisab</h2>
                <p style="color: #718096; margin: 5px 0 0 0; font-size: 14px;">Contact Support Response</p>
            </div>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5; margin-top: 0;">Hello <strong>${contact.name}</strong>,</p>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.5;">This is a reply to your message regarding: <strong>"${contact.subject}"</strong>.</p>
            
            <div style="background-color: #f7fafc; border-left: 4px solid #e2e8f0; padding: 12px 16px; margin: 15px 0; color: #718096; font-style: italic; font-size: 14px;">
                "${contact.message}"
            </div>

            <div style="margin: 20px 0; padding: 18px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px; color: #1e293b; font-size: 15px; line-height: 1.6;">
                <h4 style="margin: 0 0 8px 0; color: #166534; font-weight: 600;">Support Reply:</h4>
                ${replyMessage.replace(/\n/g, "<br/>")}
            </div>
            
            <p style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 15px;">
                This email was sent by Bazar Hisab Support. Please do not reply directly to this email.
            </p>
        </div>
    `;

    // Fire and forget email dispatch to prevent blocking API response
    sendMail(contact.email, `Re: ${contact.subject}`, html);

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
