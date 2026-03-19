import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Product categories
const categories = [
  "House Cleaning",
  "Beauty Products", 
  "Massage Accessory",
  "Home Product",
  "Bottle Accessory",
  "Kids Products",
  "Pet Grooming",
  "Mate Accessory"
]

// Sample product data with variations
const productData = [
  // House Cleaning Products
  { name: "Premium Glass Cleaner", category: "House Cleaning", basePrice: 25, ctnQty: 50 },
  { name: "Floor Cleaner Liquid", category: "House Cleaning", basePrice: 35, ctnQty: 48 },
  { name: "Toilet Cleaner Gel", category: "House Cleaning", basePrice: 28, ctnQty: 50 },
  { name: "Dishwashing Liquid", category: "House Cleaning", basePrice: 32, ctnQty: 48 },
  { name: "Laundry Detergent Powder", category: "House Cleaning", basePrice: 45, ctnQty: 40 },
  { name: "Fabric Softener", category: "House Cleaning", basePrice: 38, ctnQty: 48 },
  { name: "Hand Sanitizer", category: "House Cleaning", basePrice: 22, ctnQty: 100 },
  { name: "Disinfectant Spray", category: "House Cleaning", basePrice: 42, ctnQty: 48 },
  { name: "Kitchen Cleaner", category: "House Cleaning", basePrice: 36, ctnQty: 48 },
  { name: "Bathroom Cleaner", category: "House Cleaning", basePrice: 40, ctnQty: 48 },
  { name: "Carpet Cleaner", category: "House Cleaning", basePrice: 55, ctnQty: 30 },
  { name: "Wood Polish", category: "House Cleaning", basePrice: 48, ctnQty: 36 },
  { name: "Air Freshener", category: "House Cleaning", basePrice: 18, ctnQty: 60 },

  // Beauty Products
  { name: "Face Cream Moisturizer", category: "Beauty Products", basePrice: 85, ctnQty: 24 },
  { name: "Sunscreen SPF 50", category: "Beauty Products", basePrice: 95, ctnQty: 24 },
  { name: "Lip Balm Set", category: "Beauty Products", basePrice: 28, ctnQty: 50 },
  { name: "Hair Oil", category: "Beauty Products", basePrice: 65, ctnQty: 30 },
  { name: "Shampoo", category: "Beauty Products", basePrice: 72, ctnQty: 24 },
  { name: "Conditioner", category: "Beauty Products", basePrice: 68, ctnQty: 24 },
  { name: "Body Lotion", category: "Beauty Products", basePrice: 78, ctnQty: 24 },
  { name: "Face Wash", category: "Beauty Products", basePrice: 58, ctnQty: 30 },
  { name: "Toner", category: "Beauty Products", basePrice: 45, ctnQty: 30 },
  { name: "Serum Vitamin C", category: "Beauty Products", basePrice: 120, ctnQty: 20 },
  { name: "Nail Polish Set", category: "Beauty Products", basePrice: 35, ctnQty: 40 },
  { name: "Makeup Remover", category: "Beauty Products", basePrice: 42, ctnQty: 36 },
  { name: "Perfume 50ml", category: "Beauty Products", basePrice: 150, ctnQty: 12 },

  // Massage Accessory
  { name: "Massage Oil 500ml", category: "Massage Accessory", basePrice: 85, ctnQty: 20 },
  { name: "Aromatherapy Candles", category: "Massage Accessory", basePrice: 45, ctnQty: 30 },
  { name: "Hot Stone Set", category: "Massage Accessory", basePrice: 120, ctnQty: 10 },
  { name: "Massage Cream", category: "Massage Accessory", basePrice: 65, ctnQty: 24 },
  { name: "Essential Oil Set", category: "Massage Accessory", basePrice: 95, ctnQty: 16 },
{ name: "Back Massager", category: "Massage Accessory", basePrice: 180, ctnQty: 8 },
  { name: "Foot Spa Basin", category: "Massage Accessory", basePrice: 145, ctnQty: 8 },
  { name: "Hand Massager", category: "Massage Accessory", basePrice: 98, ctnQty: 12 },
  { name: "Massage Roller", category: "Massage Accessory", basePrice: 55, ctnQty: 20 },
  { name: "Acupressure Mat", category: "Massage Accessory", basePrice: 165, ctnQty: 6 },
  { name: "Reflexology Tools", category: "Massage Accessory", basePrice: 75, ctnQty: 15 },
  { name: "Massage Table Cover", category: "Massage Accessory", basePrice: 35, ctnQty: 25 },

  // Home Products
  { name: "LED Bulb Pack", category: "Home Product", basePrice: 25, ctnQty: 50 },
  { name: "Extension Cord 3M", category: "Home Product", basePrice: 45, ctnQty: 30 },
  { name: "Door Bell", category: "Home Product", basePrice: 85, ctnQty: 15 },
  { name: "Wall Clock", category: "Home Product", basePrice: 95, ctnQty: 12 },
  { name: "Photo Frame Set", category: "Home Product", basePrice: 55, ctnQty: 20 },
  { name: "Cushion Cover", category: "Home Product", basePrice: 38, ctnQty: 30 },
  { name: "Curtain Rod", category: "Home Product", basePrice: 125, ctnQty: 10 },
  { name: "Flower Vase", category: "Home Product", basePrice: 65, ctnQty: 20 },
  { name: "Wall Shelf", category: "Home Product", basePrice: 85, ctnQty: 15 },
  { name: "Table Lamp", category: "Home Product", basePrice: 145, ctnQty: 8 },
  { name: "Mirror Round", category: "Home Product", basePrice: 78, ctnQty: 15 },
  { name: "Coaster Set", category: "Home Product", basePrice: 28, ctnQty: 40 },
  { name: "Candle Holder", category: "Home Product", basePrice: 42, ctnQty: 30 },

  // Bottle Accessories
  { name: "Steel Water Bottle 1L", category: "Bottle Accessory", basePrice: 95, ctnQty: 20 },
  { name: "Plastic Bottle 500ml", category: "Bottle Accessory", basePrice: 18, ctnQty: 60 },
  { name: "Bottle Cap Opener", category: "Bottle Accessory", basePrice: 15, ctnQty: 100 },
  { name: "Bottle Brush Set", category: "Bottle Accessory", basePrice: 25, ctnQty: 50 },
  { name: "Insulated Flask", category: "Bottle Accessory", basePrice: 145, ctnQty: 12 },
  { name: "Water Filter Pitcher", category: "Bottle Accessory", basePrice: 185, ctnQty: 8 },
  { name: "Bottle Stand", category: "Bottle Accessory", basePrice: 55, ctnQty: 20 },
  { name: "Travel Mug", category: "Bottle Accessory", basePrice: 75, ctnQty: 24 },
  { name: "Coffee Mug Set", category: "Bottle Accessory", basePrice: 45, ctnQty: 30 },
  { name: "Glass Tumbler Set", category: "Bottle Accessory", basePrice: 65, ctnQty: 24 },
  { name: "Bottle Decanter", category: "Bottle Accessory", basePrice: 125, ctnQty: 10 },
  { name: "Sports Bottle", category: "Bottle Accessory", basePrice: 58, ctnQty: 30 },

  // Kids Products
  { name: "Baby Diaper Pack", category: "Kids Products", basePrice: 145, ctnQty: 16 },
  { name: "Baby Wipes", category: "Kids Products", basePrice: 35, ctnQty: 48 },
  { name: "Baby Shampoo", category: "Kids Products", basePrice: 55, ctnQty: 30 },
  { name: "Baby Lotion", category: "Kids Products", basePrice: 62, ctnQty: 24 },
  { name: "Kids Toothpaste", category: "Kids Products", basePrice: 28, ctnQty: 50 },
  { name: "Kids Toothbrush", category: "Kids Products", basePrice: 18, ctnQty: 60 },
  { name: "Baby Feeding Bottle", category: "Kids Products", basePrice: 75, ctnQty: 24 },
  { name: "Kids Toy Car", category: "Kids Products", basePrice: 45, ctnQty: 30 },
  { name: "Kids Puzzle Set", category: "Kids Products", basePrice: 65, ctnQty: 20 },
  { name: "Kids Coloring Book", category: "Kids Products", basePrice: 25, ctnQty: 50 },
  { name: "Kids Crayon Set", category: "Kids Products", basePrice: 32, ctnQty: 40 },
  { name: "Kids Backpack", category: "Kids Products", basePrice: 125, ctnQty: 15 },
  { name: "Kids Water Bottle", category: "Kids Products", basePrice: 55, ctnQty: 25 },

  // Pet Grooming
  { name: "Pet Shampoo", category: "Pet Grooming", basePrice: 65, ctnQty: 24 },
  { name: "Pet Brush", category: "Pet Grooming", basePrice: 35, ctnQty: 40 },
  { name: "Pet Nail Clipper", category: "Pet Grooming", basePrice: 28, ctnQty: 50 },
  { name: "Pet Collar", category: "Pet Grooming", basePrice: 42, ctnQty: 30 },
  { name: "Pet Leash", category: "Pet Grooming", basePrice: 55, ctnQty: 24 },
  { name: "Pet Bed", category: "Pet Grooming", basePrice: 245, ctnQty: 6 },
  { name: "Pet Food Bowl", category: "Pet Grooming", basePrice: 38, ctnQty: 30 },
  { name: "Pet Toy Ball", category: "Pet Grooming", basePrice: 22, ctnQty: 50 },
  { name: "Pet Grooming Kit", category: "Pet Grooming", basePrice: 125, ctnQty: 12 },
  { name: "Pet Hair Dryer", category: "Pet Grooming", basePrice: 185, ctnQty: 8 },
  { name: "Pet Carrier Bag", category: "Pet Grooming", basePrice: 165, ctnQty: 8 },
  { name: "Pet Waste Bags", category: "Pet Grooming", basePrice: 18, ctnQty: 60 },
  { name: "Pet Toothbrush", category: "Pet Grooming", basePrice: 25, ctnQty: 50 },

  // Mate Accessories (Yerba Mate accessories)
  { name: "Mate Gourd", category: "Mate Accessory", basePrice: 85, ctnQty: 20 },
  { name: "Metal Straw (Bombilla)", category: "Mate Accessory", basePrice: 35, ctnQty: 40 },
  { name: "Mate Set Gift Box", category: "Mate Accessory", basePrice: 165, ctnQty: 10 },
  { name: "Thermos for Mate", category: "Mate Accessory", basePrice: 145, ctnQty: 12 },
  { name: "Mate Powder Can", category: "Mate Accessory", basePrice: 95, ctnQty: 16 },
  { name: "Traditional Gourd", category: "Mate Accessory", basePrice: 125, ctnQty: 12 },
  { name: "Bamboo Straw Set", category: "Mate Accessory", basePrice: 25, ctnQty: 50 },
  { name: "Mate Brewing Kit", category: "Mate Accessory", basePrice: 75, ctnQty: 20 },
  { name: "Glass Mate Cup", category: "Mate Accessory", basePrice: 55, ctnQty: 24 },
  { name: "Mate Accessories Pack", category: "Mate Accessory", basePrice: 195, ctnQty: 8 },
  { name: "Ceramic Mate Cup", category: "Mate Accessory", basePrice: 65, ctnQty: 20 },
  { name: "Leather Mate Bag", category: "Mate Accessory", basePrice: 135, ctnQty: 10 },
  { name: "Mate Tea Variety Pack", category: "Mate Accessory", basePrice: 115, ctnQty: 12 },
]

// Image URLs from Unsplash (reliable placeholder images)
const imageUrls = [
  "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=400&h=400&fit=crop",
]

function generateSlug(name: string, index: number): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + index
}

function generateProductCode(index: number): string {
  return 'PRD' + String(index + 1).padStart(5, '0')
}

function getRandomImage(): string {
  return imageUrls[Math.floor(Math.random() * imageUrls.length)]
}

function getMultipleImages(): string[] {
  const numImages = Math.floor(Math.random() * 3) + 2 // 2-4 images
  const images: string[] = []
  const shuffled = [...imageUrls].sort(() => 0.5 - Math.random())
  for (let i = 0; i < numImages; i++) {
    images.push(shuffled[i])
  }
  return images
}

async function main() {
  console.log('Starting to seed products...')
  
  // Clear existing products
  await prisma.product.deleteMany()
  console.log('Cleared existing products')

  // Generate 100 products
  const products = []
  
  for (let i = 0; i < 100; i++) {
    // Cycle through the product data
    const data = productData[i % productData.length]
    
    const singlePrice = data.basePrice + Math.floor(Math.random() * 20) - 10
    const cartonPrice = Math.floor(singlePrice * data.ctnQty * 0.85) // 15% discount for bulk
    const cartonPcsPrice = cartonPrice / data.ctnQty
    
    products.push({
      name: data.name + (i >= productData.length ? ` V${Math.floor(i / productData.length) + 1}` : ''),
      slug: generateSlug(data.name, i),
      productCode: generateProductCode(i),
      description: `High quality ${data.name.toLowerCase()} for wholesale buyers. Premium quality product with excellent finish. Perfect for retailers and businesses. GST inclusive pricing available.`,
      imageUrl: getRandomImage(),
      imageUrls: getMultipleImages() as any,
      singlePrice: singlePrice,
      cartonPrice: cartonPrice,
      cartonPcsPrice: cartonPcsPrice,
      cartonQty: data.ctnQty,
      gstPercentage: 18,
      weight: Math.round((0.1 + Math.random() * 0.5) * 100) / 100,
      stock: Math.floor(Math.random() * 500) + 50,
      category: data.category,
      subCategory: data.category.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
    })
  }

  // Insert all products
  await prisma.product.createMany({
    data: products,
  })

  console.log(`Successfully created ${products.length} products`)
  
  // Verify
  const count = await prisma.product.count()
  console.log(`Total products in database: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
