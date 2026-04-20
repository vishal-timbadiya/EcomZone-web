import { Router } from "express";
import ordersRouter from "./route";
import ordersIdRouter from "./[id]/route";
import ordersUpdateRouter from "./update/route";
import ordersPaymentUpdateRouter from "./payment-update/route";
import ordersBulkUpdateRouter from "./bulk-update/route";
import ordersSimplePdfRouter from "./simple-pdf/route";
import ordersDownloadPdfRouter from "./download-pdf/route";

const router = Router();

router.use('/', ordersRouter);

// Mount specific routes before wildcard :id route
router.use('/payment-update', ordersPaymentUpdateRouter);
router.use('/bulk-update', ordersBulkUpdateRouter);
router.use('/simple-pdf', ordersSimplePdfRouter);
router.use('/download-pdf', ordersDownloadPdfRouter);
router.use('/update', ordersUpdateRouter);

// Mount :id route last (wildcard pattern)
router.use('/:id', ordersIdRouter);

export default router;
