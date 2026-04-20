import { Router } from "express";
import catalogueRouter from "./route";

const router = Router();

router.use("/", catalogueRouter);

export default router;
