import { Router } from "express";
import usersRouter from "./route";
import usersIdRouter from "./[id]/route";
import usersResetPasswordRouter from "./reset-password/route";

const router = Router();

router.use('/', usersRouter);

// Mounted WITHOUT the :id segment - the router itself handles '/:id'. Mounting
// at '/reset-password/:id' made the real path '/reset-password/:id/:id', so the
// endpoint was unreachable and always 404'd.
router.use('/reset-password', usersResetPasswordRouter);
router.use('/:id', usersIdRouter);

export default router;

