import { Router } from "express";
import subAdminRouter from "./route";
import subAdminIdRouter from "./[id]/route";

const router = Router();

// Mount main sub-admin routes (GET, POST)
router.use('/', subAdminRouter);

// Mount :id routes (PUT, DELETE) - must come after specific routes
router.use('/:id', subAdminIdRouter);

export default router;
