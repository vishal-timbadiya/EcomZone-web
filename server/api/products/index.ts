import { Router } from "express";
import productsRouter from "./route";
import slugRouter from "./[slug]/route";

const router = Router();

router.use("/", productsRouter);
router.use("/:slug", slugRouter);

export default router;
