import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { contactControllers } from "./contact.controllers";

const router = Router();

// Public route to submit contact forms
router.post("/", contactControllers.submitMessage);

// Admin-only endpoints
router.get("/", auth, authorize(["ADMIN"]), contactControllers.getAllMessages);
router.get("/:id", auth, authorize(["ADMIN"]), contactControllers.getMessageById);
router.patch("/:id/reply", auth, authorize(["ADMIN"]), contactControllers.replyToMessage);
router.delete("/:id", auth, authorize(["ADMIN"]), contactControllers.deleteMessage);

export const contactRoutes = router;
