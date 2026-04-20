import { Router } from "express";
import usersRouter from "./route";
import usersIdRouter from "./[id]/route";
import usersResetPasswordRouter from "./reset-password/route";

const router = Router();

router.use('/', usersRouter);

router.use('/reset-password/:id', usersResetPasswordRouter);
router.use('/:id', usersIdRouter);

export default router;
