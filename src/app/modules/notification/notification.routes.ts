import { Router } from "express";
import auth from "../../middlewares/auth";
import { notificationControllers } from "./notification.controllers";

const router = Router();

router.get("/", auth, notificationControllers.getMyNotifications);
router.patch("/read-all", auth, notificationControllers.markAllAsRead);
router.patch("/:id/read", auth, notificationControllers.markAsRead);
router.delete("/", auth, notificationControllers.deleteAllNotifications);
router.delete("/:id", auth, notificationControllers.deleteNotification);

export const notificationRoutes = router;
