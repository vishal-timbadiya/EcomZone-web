import { Router } from "express";
import adminProductsRouter from "./products";
import adminOrdersRouter from "./orders";
import adminCategoriesRouter from "./categories";
import adminUsersRouter from "./users";
import adminSettingsRouter from "./settings/route";
import adminMakeAdminRouter from "./make-admin/route";

const router = Router();

router.use("/products", adminProductsRouter);
router.use("/orders", adminOrdersRouter);
router.use("/categories", adminCategoriesRouter);
router.use("/users", adminUsersRouter);
router.use("/settings", adminSettingsRouter);
router.use("/make-admin", adminMakeAdminRouter);

export default router;

