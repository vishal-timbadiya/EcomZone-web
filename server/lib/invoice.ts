import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Invoice PDF generation, extracted out of the order-creation request handler.
 */

export interface InvoiceAddress {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  mobile?: string;
  email?: string;
}

export interface InvoiceOrder {
  orderId: string;
  createdAt: Date;
  paymentMode: string;
  subtotal: number;
  gstAmount: number;
  shippingCharge: number;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export async function generateInvoicePdf(
  order: InvoiceOrder,
  shippingAddr: InvoiceAddress
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Standard letter size
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 760;
  const leftMargin = 50;
  const rightMargin = 562;
  const contentWidth = rightMargin - leftMargin;

  // HEADER SECTION
  page.drawText('ECOMZONE', {
    x: leftMargin, y, size: 32, font: boldFont, color: rgb(0.1, 0.4, 0.8),
  });
  page.drawText('INVOICE', {
    x: rightMargin - 100, y, size: 20, font: boldFont, color: rgb(0.1, 0.4, 0.8),
  });

  y -= 40;

  page.drawLine({
    start: { x: leftMargin, y }, end: { x: rightMargin, y },
    thickness: 2, color: rgb(0.1, 0.4, 0.8),
  });

  y -= 25;

  page.drawText('Invoice Details', {
    x: leftMargin, y, size: 11, font: boldFont, color: rgb(0, 0, 0),
  });

  y -= 15;
  page.drawText(`Invoice No: ${order.orderId}`, { x: leftMargin, y, size: 10, font: regularFont });
  y -= 12;
  page.drawText(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, { x: leftMargin, y, size: 10, font: regularFont });
  y -= 12;
  page.drawText(`Payment Mode: ${order.paymentMode}`, { x: leftMargin, y, size: 10, font: regularFont });

  // Right column - Bill To
  const rightColX = leftMargin + 300;
  let billY = y + 39;

  page.drawText('Bill To', {
    x: rightColX, y: billY, size: 11, font: boldFont, color: rgb(0, 0, 0),
  });

  billY -= 15;

  const billLines = [
    shippingAddr.name || 'Customer',
    shippingAddr.address || '',
    `${shippingAddr.city || ''}, ${shippingAddr.state || ''} ${shippingAddr.pincode || ''}`,
    `Phone: ${shippingAddr.mobile || ''}`,
    `Email: ${shippingAddr.email || ''}`,
  ].filter((line) => line.trim());

  billLines.forEach((line) => {
    page.drawText(line, { x: rightColX, y: billY, size: 9, font: regularFont });
    billY -= 10;
  });

  y -= 80;

  // Table header background
  page.drawRectangle({
    x: leftMargin, y: y - 20, width: contentWidth, height: 22,
    color: rgb(0.1, 0.4, 0.8), borderColor: rgb(0, 0, 0), borderWidth: 1,
  });

  const headerCells: Array<[string, number]> = [
    ['Item Description', 5], ['Qty', 300], ['Rate', 350], ['Amount', 420],
  ];

  headerCells.forEach(([label, offset]) => {
    page.drawText(label, {
      x: leftMargin + offset, y: y - 15, size: 9, font: boldFont, color: rgb(1, 1, 1),
    });
  });

  y -= 25;

  order.items.forEach((item, index) => {
    // Guard against a divide-by-zero on a zero-quantity line.
    const unitPrice = item.quantity > 0 ? item.price / item.quantity : 0;

    if (index % 2 === 0) {
      page.drawRectangle({
        x: leftMargin, y: y - 18, width: contentWidth, height: 18,
        color: rgb(0.95, 0.95, 0.95),
      });
    }

    page.drawText(item.name.substring(0, 35), { x: leftMargin + 5, y: y - 13, size: 9, font: regularFont });
    page.drawText(item.quantity.toString(), { x: leftMargin + 310, y: y - 13, size: 9, font: regularFont });
    page.drawText(`Rs ${unitPrice.toFixed(2)}`, { x: leftMargin + 360, y: y - 13, size: 9, font: regularFont });
    page.drawText(`Rs ${item.price.toFixed(2)}`, { x: leftMargin + 430, y: y - 13, size: 9, font: regularFont });

    y -= 20;
  });

  y -= 15;

  const summaryX = leftMargin + 350;

  const summaryRows: Array<[string, number]> = [['Subtotal:', order.subtotal]];
  if (order.gstAmount > 0) summaryRows.push(['GST Amount:', order.gstAmount]);
  if (order.shippingCharge > 0) summaryRows.push(['Shipping Charge:', order.shippingCharge]);

  summaryRows.forEach(([label, value]) => {
    page.drawText(label, { x: summaryX, y, size: 9, font: regularFont });
    page.drawText(`Rs ${value.toFixed(2)}`, { x: summaryX + 100, y, size: 9, font: regularFont });
    y -= 15;
  });

  // Grand total box
  page.drawRectangle({
    x: summaryX - 10, y: y - 22, width: 160, height: 25,
    color: rgb(0.1, 0.4, 0.8), borderColor: rgb(0, 0, 0), borderWidth: 1,
  });

  page.drawText('TOTAL DUE:', {
    x: summaryX, y: y - 16, size: 11, font: boldFont, color: rgb(1, 1, 1),
  });
  page.drawText(`Rs ${order.totalAmount.toFixed(2)}`, {
    x: summaryX + 100, y: y - 16, size: 11, font: boldFont, color: rgb(1, 1, 1),
  });

  y -= 50;

  page.drawLine({
    start: { x: leftMargin, y }, end: { x: rightMargin, y },
    thickness: 1, color: rgb(0.7, 0.7, 0.7),
  });

  y -= 15;

  page.drawText('Thank you for your business!', {
    x: leftMargin, y, size: 9, font: boldFont, color: rgb(0.1, 0.4, 0.8),
  });

  y -= 12;

  page.drawText('Website: www.ecomzone.in | Email: ecomzone.sales@gmail.com', {
    x: leftMargin, y, size: 8, font: regularFont, color: rgb(0.5, 0.5, 0.5),
  });

  return pdfDoc.save();
}
