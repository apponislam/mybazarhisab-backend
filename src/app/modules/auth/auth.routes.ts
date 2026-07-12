import { Router } from "express";
import { authControllers } from "./auth.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
const router = Router();

// Public routes
router.post("/register", authControllers.register);
router.post("/login", authControllers.login);
router.get("/verify-email", authControllers.verifyEmail);
router.post("/resend-verification", authControllers.resendVerificationEmail);
router.post("/refresh-token", authControllers.refreshAccessToken);
router.post("/forgot-password", authControllers.requestPasswordReset);
router.post("/verify-otp", authControllers.verifyOtp);
router.post("/resend-otp", authControllers.resendOtp);
router.post("/reset-password", authControllers.resetPassword);

// Protected routes (require auth)
router.get("/me", auth, authControllers.getMe);
router.post("/logout", auth, authControllers.logout);
router.patch("/profile", auth, authControllers.updateProfile);
router.post("/change-password", auth, authControllers.changePassword);
router.post("/update-email", auth, authControllers.updateEmail);
router.get("/verify-new-email", authControllers.verifyNewEmail);
router.post("/resend-email-update", auth, authControllers.resendEmailUpdate);
router.delete("/me", auth, authControllers.deleteAccount);

// Admin only routes
router.post("/set-password/:userId", auth, authorize(["ADMIN"]), authControllers.setUserPassword);
router.delete("/:userId", auth, authorize(["ADMIN"]), authControllers.deleteUserByAdmin);

export const authRoutes = router;
