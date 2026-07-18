import { Router } from "express";
import auth from "../../middlewares/auth";
import { groupControllers } from "./group.controllers";

const router = Router();

router.post("/", auth, groupControllers.createGroup);
router.post("/join", auth, groupControllers.joinGroup);
router.post("/leave", auth, groupControllers.leaveGroup);
router.patch("/", auth, groupControllers.updateGroup);
router.get("/my-group", auth, groupControllers.getMyGroup);
router.get("/check-group", auth, groupControllers.checkGroupMembership);

export const groupRoutes = router;
