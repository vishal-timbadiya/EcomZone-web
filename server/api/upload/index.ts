import { Router } from "express";
import uploadRouter from "./router";

const router = Router();

router.use("/", uploadRouter);

export default router;
