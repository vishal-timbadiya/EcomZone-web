import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb } from 'pdf-lib';
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
      const type = req.query.type as string || 'all-products';
  
      // Fetch products
      let products;
  
      if (type === 'new-arrivals') {
        products = await prisma.product.findMany({
          where: { isActive: true, isNewArrival: true },
          select: {
            id: true,
            name: true,
            productCode: true,
            singlePrice: true,
            cartonQty: true,
            imageUrl: true,
          },
          take: 500,
          orderBy: { createdAt: 'desc' },
        });
      } else if (type === 'bestsellers') {
        products = await prisma.product.findMany({
          where: { isActive: true, isBestseller: true },
          select: {
            id: true,
            name: true,
            productCode: true,
            singlePrice: true,
            cartonQty: true,
            imageUrl: true,
          },
          take: 500,
          orderBy: { createdAt: 'desc' },
        });
      } else {
        // All products
        products = await prisma.product.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            productCode: true,
            singlePrice: true,
            cartonQty: true,
            imageUrl: true,
          },
          take: 500,
          orderBy: { name: 'asc' },
        });
      }
  
      // Fetch all images in parallel
      const productsWithImages = await getProductsWithImages(products);
  
      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      let currentPage = pdfDoc.addPage([595, 842]);
      let yPosition = 800;
      const margin = 12;
      const pageWidth = 595;
      const pageHeight = 842;
      const contentWidth = pageWidth - margin * 2;
  
      // Add header
      currentPage.drawText('EcomZone', {
        x: margin,
        y: yPosition,
        size: 20,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;
  
      currentPage.drawText(`${getCatalogueName(type)}`, {
        x: margin,
        y: yPosition,
        size: 11,
        color: rgb(0, 0, 0),
      });
      yPosition -= 18;
  
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString('en-IN')}`, {
        x: margin,
        y: yPosition,
        size: 8,
        color: rgb(102 / 255, 102 / 255, 102 / 255),
      });
      yPosition -= 15;
  
      // Separator line
      currentPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 1,
        color: rgb(200 / 255, 200 / 255, 200 / 255),
      });
      yPosition -= 10;
  
      currentPage.drawText('Email: ecomzone.sales@gmail.com | Phone: +91 81608 72204', {
        x: margin,
        y: yPosition,
        size: 8,
        color: rgb(51 / 255, 51 / 255, 51 / 255),
      });
      yPosition -= 15;
  
      // Grid layout - 2 products per row
      const cardsPerRow = 2;
      const cardWidth = (contentWidth - 8) / cardsPerRow;
      const cardHeight = 140;
      const imageHeight = 50;
  
      let xPos = margin;
      let cardCount = 0;
  
      for (const product of productsWithImages) {
        // Check if we need a new page
        if (yPosition - cardHeight < 30) {
          currentPage = pdfDoc.addPage([595, 842]);
          yPosition = 800;
        }
  
        // Draw card border
        currentPage.drawRectangle({
          x: xPos,
          y: yPosition - cardHeight,
          width: cardWidth,
          height: cardHeight,
          borderColor: rgb(209 / 255, 213 / 255, 219 / 255),
          borderWidth: 1,
        });
  
        // Image area - light background
        const imageX = xPos + 4;
        const imageY = yPosition - cardHeight + 4;
        const imageW = cardWidth - 8;
  
        currentPage.drawRectangle({
          x: imageX,
          y: imageY,
          width: imageW,
          height: imageHeight,
          color: rgb(243 / 255, 244 / 255, 246 / 255),
        });
  
        // Draw image if available
        if (product.imageBuffer) {
          try {
            // Determine image type from buffer signature
            let imageType: 'png' | 'jpeg' = 'png';
            if (product.imageBuffer[0] === 0xff && product.imageBuffer[1] === 0xd8) {
              imageType = 'jpeg';
            }
  
            const image =
              imageType === 'jpeg'
                ? await pdfDoc.embedJpg(product.imageBuffer)
                : await pdfDoc.embedPng(product.imageBuffer);
  
            const imageDims = image.scale(1);
            const scale = Math.min(imageW / imageDims.width, imageHeight / imageDims.height);
  
            currentPage.drawImage(image, {
              x: imageX + (imageW - imageDims.width * scale) / 2,
              y: imageY,
              width: imageDims.width * scale,
              height: imageDims.height * scale,
            });
          } catch (err) {
            currentPage.drawText('Image error', {
              x: imageX + 5,
              y: imageY + imageHeight / 2 - 4,
              size: 7,
              color: rgb(156 / 255, 163 / 255, 175 / 255),
            });
          }
        } else {
          currentPage.drawText('No Image', {
            x: imageX + 5,
            y: imageY + imageHeight / 2 - 4,
            size: 7,
            color: rgb(156 / 255, 163 / 255, 175 / 255),
          });
        }
  
        // Product name
        const nameY = imageY + imageHeight + 4;
        const truncatedName =
          product.name.length > 40 ? product.name.substring(0, 40) + '...' : product.name;
  
        currentPage.drawText(truncatedName, {
          x: xPos + 4,
          y: nameY,
          size: 8,
          color: rgb(0, 0, 0),
        });
  
        // Separator line
        const separatorY = nameY - 16;
        currentPage.drawLine({
          start: { x: xPos + 4, y: separatorY },
          end: { x: xPos + cardWidth - 4, y: separatorY },
          thickness: 0.5,
          color: rgb(229 / 255, 231 / 255, 235 / 255),
        });
  
        // Product details
        const detailsY = separatorY - 10;
  
        // Price label
        currentPage.drawText('PRICE', {
          x: xPos + 4,
          y: detailsY,
          size: 6,
          color: rgb(107 / 255, 114 / 255, 128 / 255),
        });
  
        // Price value
        currentPage.drawText(`Rs ${Math.round(product.singlePrice)}`, {
          x: xPos + 4,
          y: detailsY - 7,
          size: 8,
          color: rgb(255 / 255, 107 / 255, 53 / 255),
        });
  
        // Code label
        currentPage.drawText('CODE', {
          x: xPos + 4,
          y: detailsY - 15,
          size: 6,
          color: rgb(107 / 255, 114 / 255, 128 / 255),
        });
  
        // Code value
        currentPage.drawText(product.productCode || 'N/A', {
          x: xPos + 4,
          y: detailsY - 22,
          size: 7,
          color: rgb(0, 0, 0),
        });
  
        // Carton label
        currentPage.drawText('CARTON', {
          x: xPos + cardWidth / 2,
          y: detailsY,
          size: 6,
          color: rgb(107 / 255, 114 / 255, 128 / 255),
        });
  
        // Carton value
        currentPage.drawText((product.cartonQty || '0').toString(), {
          x: xPos + cardWidth / 2,
          y: detailsY - 7,
          size: 8,
          color: rgb(0, 0, 0),
        });
  
        // Move to next position
        cardCount++;
        if (cardCount % cardsPerRow === 0) {
          xPos = margin;
          yPosition -= cardHeight + 6;
        } else {
          xPos += cardWidth + 8;
        }
      }
  
      // Generate PDF buffer
      const pdfBytes = await pdfDoc.save();
  
      // Set response headers
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', `attachment; filename="${type}-catalogue.pdf"`);
  
      res.status(200);
      res.set(headers);
      return res.send(Buffer.from(pdfBytes));
    } catch (error: any) {
      console.error('Error generating PDF catalogue:', error);
      return res.status(500).json({ error: 'PDF generation failed', message: error.message });
    }
  });

export default router;
