import { Router } from "express";
import youtubeRouter from "./route";

const router = Router();

router.use("/", youtubeRouter);

export default router;
