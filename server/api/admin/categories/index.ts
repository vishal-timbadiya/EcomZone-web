import { Router } from "express";
import categoriesRouter from "./route";
import categoriesUpdateRouter from "./update/[id]/route";
import categoriesSlugRouter from "./[slug]/route";

const router = Router();

router.use('/', categoriesRouter);

router.use('/update/:id', categoriesUpdateRouter);
router.use('/:slug', categoriesSlugRouter);

export default router;
