import { Router } from "express";
import categoriesRouter from "./route";

const router = Router();

router.use("/", categoriesRouter);

export default router;
