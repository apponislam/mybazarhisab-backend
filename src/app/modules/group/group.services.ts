import mongoose from "mongoose";
import httpStatus from "http-status";
import crypto from "crypto";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { GroupModel } from "./group.model";
import { activityServices } from "../activity/activity.services";
import { ActivityType } from "../activity/activity.interface";

const createGroup = async (userId: string, name: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Verify user is not already in a group
        const user = await UserModel.findOne({ _id: userId, isDeleted: false }).session(session);
        if (!user) {
            throw new ApiError(httpStatus.NOT_FOUND, "User not registered");
        }

        if (user.groupId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "You are already a member of a group. Leave it first.");
        }

        // 2. Create Group (inviteCode generated automatically by pre-save hook)
        const [group] = await GroupModel.create(
            [
                {
                    name: name.trim(),
                    creator: userId,
                    members: [userId],
                },
            ],
            { session }
        );

        // 3. Link user to group
        user.groupId = group._id;
        await user.save({ session });

        // Log activity in the background
        activityServices.logActivity(
            userId,
            ActivityType.CREATE_GROUP,
            `Created group "${group.name}"`,
            group._id.toString(),
            { groupId: group._id }
        );

        await session.commitTransaction();
        session.endSession();

        return group;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const joinGroup = async (userId: string, inviteCode: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Verify user is not already in a group
        const user = await UserModel.findOne({ _id: userId, isDeleted: false }).session(session);
        if (!user) {
            throw new ApiError(httpStatus.NOT_FOUND, "User not registered");
        }

        if (user.groupId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "You are already a member of a group. Leave it first.");
        }

        // 2. Find group by invite code
        const group = await GroupModel.findOne({ inviteCode: inviteCode.trim().toUpperCase(), isDeleted: false }).session(session);
        if (!group) {
            throw new ApiError(httpStatus.NOT_FOUND, "Invalid invite code or group not found");
        }

        // Limit maximum members to 20
        if (group.members.length >= 20) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Group is full. A maximum of 20 members are allowed per group.");
        }

        // 3. Add member to group
        if (group.members.includes(new mongoose.Types.ObjectId(userId))) {
            throw new ApiError(httpStatus.BAD_REQUEST, "You are already a member of this group");
        }

        group.members.push(new mongoose.Types.ObjectId(userId));
        await group.save({ session });

        // 4. Link user to group
        user.groupId = group._id;
        await user.save({ session });

        // Log activity in the background
        activityServices.logActivity(
            userId,
            ActivityType.JOIN_GROUP,
            `Joined group "${group.name}"`,
            group._id.toString(),
            { groupId: group._id }
        );

        await session.commitTransaction();
        session.endSession();

        return group;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const leaveGroup = async (userId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Verify user has a group
        const user = await UserModel.findOne({ _id: userId, isDeleted: false }).session(session);
        if (!user) {
            throw new ApiError(httpStatus.NOT_FOUND, "User not registered");
        }

        if (!user.groupId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "You are not in a group");
        }

        const group = await GroupModel.findOne({ _id: user.groupId, isDeleted: false }).session(session);
        if (!group) {
            user.groupId = undefined;
            await user.save({ session });
            await session.commitTransaction();
            session.endSession();
            return { message: "Left group successfully" };
        }

        // 2. Remove member from group members array
        group.members = group.members.filter((memberId) => memberId.toString() !== userId);

        // 3. Handle ownership/creator change or deactivation
        if (group.members.length === 0) {
            // Group has no members, soft delete it
            group.isDeleted = true;
        } else if (group.creator.toString() === userId) {
            // Creator is leaving, assign next member as creator
            group.creator = group.members[0];
        }

        await group.save({ session });

        // 4. Unlink user from group
        user.groupId = undefined;
        await user.save({ session });

        // Log activity in the background
        activityServices.logActivity(
            userId,
            ActivityType.LEAVE_GROUP,
            `Left group "${group.name}"`,
            group._id.toString(),
            { groupId: group._id }
        );

        await session.commitTransaction();
        session.endSession();

        return { message: "Left group successfully" };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const getMyGroup = async (userId: string) => {
    const user = await UserModel.findOne({ _id: userId, isDeleted: false }).populate({
        path: "groupId",
        match: { isDeleted: false },
        populate: [
            {
                path: "members",
                select: "name email phone profileImage",
                match: { isDeleted: false }
            },
            {
                path: "creator",
                select: "name email phone profileImage",
                match: { isDeleted: false }
            }
        ]
    });

    if (!user || !user.groupId) {
        return null;
    }

    return user.groupId;
};

const updateGroup = async (userId: string, name: string) => {
    // 1. Verify user exists
    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not registered");
    }

    if (!user.groupId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You are not a member of any group");
    }

    // 2. Find group
    const group = await GroupModel.findOne({ _id: user.groupId, isDeleted: false });
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, "Group not found");
    }

    if (!name || !name.trim()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Group name is required");
    }

    // 3. Update group name
    group.name = name.trim();
    await group.save();

    // Log activity in the background
    activityServices.logActivity(
        userId,
        ActivityType.UPDATE_GROUP,
        `Updated group name to "${group.name}"`,
        group._id.toString(),
        { groupId: group._id }
    );

    return group;
};

const generateInviteCode = async (userId: string) => {
    // 1. Verify user exists and has a group
    const user = await UserModel.findOne({ _id: userId, isDeleted: false });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not registered");
    }

    if (!user.groupId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You are not a member of any group");
    }

    // 2. Find group
    const group = await GroupModel.findOne({ _id: user.groupId, isDeleted: false });
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, "Group not found");
    }

    // 3. Generate a new code
    let code = "BAZAR-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    let codeExists = await GroupModel.findOne({ inviteCode: code });
    while (codeExists) {
        code = "BAZAR-" + crypto.randomBytes(3).toString("hex").toUpperCase();
        codeExists = await GroupModel.findOne({ inviteCode: code });
    }

    group.inviteCode = code;
    await group.save();

    return group;
};

export const groupServices = {
    createGroup,
    joinGroup,
    leaveGroup,
    getMyGroup,
    updateGroup,
    generateInviteCode,
};
