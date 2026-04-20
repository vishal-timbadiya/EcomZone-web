import { Router } from "express";
import instagramRouter from "./route";

const router = Router();

router.use("/", instagramRouter);

export default router;
