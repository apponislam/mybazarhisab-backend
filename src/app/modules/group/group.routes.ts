import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { groupControllers } from "./group.controllers";

const router = Router();

// User routes
router.post("/", auth, groupControllers.createGroup);
router.post("/join", auth, groupControllers.joinGroup);
router.post("/leave", auth, groupControllers.leaveGroup);
router.patch("/", auth, groupControllers.updateGroup);
router.post("/generate-code", auth, groupControllers.generateInviteCode);
router.get("/my-group", auth, groupControllers.getMyGroup);
router.get("/check-group", auth, groupControllers.checkGroupMembership);

// Admin routes
router.get("/admin/all", auth, authorize(["ADMIN"]), groupControllers.getAllGroupsAdmin);
router.get("/admin/:id", auth, authorize(["ADMIN"]), groupControllers.getGroupByIdAdmin);
router.delete("/admin/:id", auth, authorize(["ADMIN"]), groupControllers.deleteGroupByAdmin);
router.delete("/admin/:groupId/members/:userId", auth, authorize(["ADMIN"]), groupControllers.removeMemberByAdmin);

export const groupRoutes = router;

