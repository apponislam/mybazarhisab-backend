import { Router } from "express";
import auth from "../../middlewares/auth";
import { bazarEntryControllers } from "./bazar-entry.controllers";

const router = Router();

router.post("/", auth, bazarEntryControllers.createBazarEntry);
router.get("/", auth, bazarEntryControllers.getAllBazarEntries);
router.get("/:id", auth, bazarEntryControllers.getBazarEntryById);
router.patch("/:id", auth, bazarEntryControllers.updateBazarEntry);
router.delete("/:id", auth, bazarEntryControllers.deleteBazarEntry);

export const bazarEntryRoutes = router;
