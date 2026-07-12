import { Router } from "express";
import auth from "../../middlewares/auth";
import { groupControllers } from "./group.controllers";

const router = Router();

router.post("/", auth, groupControllers.createGroup);
router.post("/join", auth, groupControllers.joinGroup);
router.post("/leave", auth, groupControllers.leaveGroup);
router.get("/my-group", auth, groupControllers.getMyGroup);

export const groupRoutes = router;
