import { Router } from "express";
import adminProductsRouter from "./products";
import adminOrdersRouter from "./orders";
import adminCategoriesRouter from "./categories";
import adminUsersRouter from "./users";
import adminSettingsRouter from "./settings/route";
import adminMakeAdminRouter from "./make-admin/route";
import adminSeedCategoriesRouter from "./seed-categories/route";
import adminFixEnumRouter from "./fix-enum/route";
import adminTestRouter from "./test/route";

const router = Router();

router.use("/products", adminProductsRouter);
router.use("/orders", adminOrdersRouter);
router.use("/categories", adminCategoriesRouter);
router.use("/users", adminUsersRouter);
router.use("/settings", adminSettingsRouter);
router.use("/make-admin", adminMakeAdminRouter);
router.use("/seed-categories", adminSeedCategoriesRouter);
router.use("/fix-enum", adminFixEnumRouter);
router.use("/test", adminTestRouter);

export default router;
