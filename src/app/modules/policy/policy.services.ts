import { IPolicy, TPolicyType } from "./policy.interface";
import { PolicyModel } from "./policy.model";
import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";
import { Types } from "mongoose";

const getDefaultPolicy = (type: TPolicyType): Partial<IPolicy> => {
    if (type === "terms") {
        return {
            title: "Terms & Conditions",
            type: "terms",
            version: "1.0",
            isPublished: true,
            content: `
## Terms & Conditions

Welcome to **Bazar Hisab**. By accessing or using our services, you agree to be bound by these terms.

### 1. Account Usage
- Users are responsible for maintaining the confidentiality of their account credentials.
- Any unauthorized use of your account must be reported immediately.

### 2. Expense & Household Group Tracking
- Bazar Hisab provides features to record shared grocery entries, member contribution calculations, and household account statements.
- Data entered into your group is accessible to authorized members of that group.

### 3. Fair Use & Privacy
- You agree not to use the service for illegal or fraudulent activities.
- We reserve the right to suspend accounts that violate system integrity.

### 4. Updates to Terms
We may update these terms from time to time. Continued use of the platform constitutes acceptance of updated terms.
            `.trim(),
        };
    } else {
        return {
            title: "Privacy Policy",
            type: "privacy",
            version: "1.0",
            isPublished: true,
            content: `
## Privacy Policy

At **Bazar Hisab**, we value and respect your privacy.

### 1. Data Collection
- **Personal Information**: Name, email address, phone number, and account profile details when registering.
- **Financial & Group Data**: Bazar logs, bill entries, calculations, and active household group data created within the app.

### 2. Data Usage
- We use your data strictly to operate, calculate balances, and improve your user experience on Bazar Hisab.
- We do not sell your personal data to third parties.

### 3. Data Protection
- Industry-standard security practices (JWT authentication, password hashing, and encrypted channels) are used to safeguard your records.

### 4. Contact Us
If you have questions regarding our privacy practices, please contact support via our Contact page.
            `.trim(),
        };
    }
};

const getPolicyByType = async (type: TPolicyType): Promise<Partial<IPolicy>> => {
    if (type !== "terms" && type !== "privacy") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid policy type. Must be 'terms' or 'privacy'");
    }

    const policy = await PolicyModel.findOne({ type, isPublished: true });
    if (!policy) {
        return getDefaultPolicy(type);
    }
    return policy;
};

const getAllPolicies = async () => {
    const policies = await PolicyModel.find();
    if (!policies || policies.length === 0) {
        return [getDefaultPolicy("terms"), getDefaultPolicy("privacy")];
    }
    return policies;
};

const upsertPolicy = async (
    type: TPolicyType,
    payload: { title?: string; content: string; version?: string; isPublished?: boolean },
    userId: string
) => {
    if (type !== "terms" && type !== "privacy") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid policy type. Must be 'terms' or 'privacy'");
    }

    const title = payload.title || (type === "terms" ? "Terms & Conditions" : "Privacy Policy");

    const policy = await PolicyModel.findOneAndUpdate(
        { type },
        {
            $set: {
                title,
                type,
                content: payload.content,
                version: payload.version || "1.0",
                isPublished: payload.isPublished !== undefined ? payload.isPublished : true,
                updatedBy: new Types.ObjectId(userId),
            },
        },
        { new: true, upsert: true, runValidators: true }
    );

    return policy;
};

export const policyServices = {
    getPolicyByType,
    getAllPolicies,
    upsertPolicy,
};
