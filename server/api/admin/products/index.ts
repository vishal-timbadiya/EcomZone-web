import { Router } from "express";
import productsRouter from "./route";
import productsIdRouter from "./[id]/route";
import productsBulkRouter from "./bulk/route";
import productsBulkActionRouter from "./bulk-action/route";
import productsBulkImportRouter from "./bulk-import/route";
import productsBulkSaveRouter from "./bulk-save/route";
import productsBulkUpsertRouter from "./bulk-upsert/route";
import productsBulkFolderImportRouter from "./bulk-folder-import/route";
import productsDownloadCsvRouter from "./download-csv/route";
import productsIdToggleRouter from "./[id]/toggle/route";

const router = Router();

router.use('/', productsRouter);

router.use('/download-csv', productsDownloadCsvRouter);

router.use('/bulk', productsBulkRouter);

router.use('/bulk-action', productsBulkActionRouter);
router.use('/bulk-import', productsBulkImportRouter);
router.use('/bulk-save', productsBulkSaveRouter);
router.use('/bulk-upsert', productsBulkUpsertRouter);
router.use('/bulk-folder-import', productsBulkFolderImportRouter);

router.use('/:id/toggle', productsIdToggleRouter);
router.use('/:id', productsIdRouter);

export default router;
