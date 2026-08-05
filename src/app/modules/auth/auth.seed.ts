import bcrypt from "bcrypt";
import { UserModel } from "./auth.model";
import config from "../../config";

export const seedAdmin = async () => {
    try {
        const { name, email, password, phone } = config.initialAdmin || {};

        if (!email || !password || !name || !phone) {
            console.log("⚠️ Initial admin configuration missing in environment variables, skipping admin seeding");
            return;
        }

        const adminExists = await UserModel.findOne({
            role: "ADMIN",
        });

        if (!adminExists) {
            console.log("📝 No admin found, creating initial admin...");

            const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

            const admin = {
                name,
                email,
                password: hashedPassword,
                role: "ADMIN",
                phone,
                isActive: true,
                isEmailVerified: true,
            };

            await UserModel.create(admin as any);

            console.log("✅ Admin created:", email);
        } else {
            console.log("✅ Admin already exists, skipping creation");
        }
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
    }
};
