const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { position: 'asc' }
    });
    
    console.log('\n=== ALL CATEGORIES IN DATABASE ===');
    console.log(JSON.stringify(categories, null, 2));
    console.log(`\nTotal categories: ${categories.length}`);
    
    // Check for slug collisions
    const slugs = categories.map(c => c.slug);
    const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (duplicates.length > 0) {
      console.log('\n⚠️  DUPLICATE SLUGS FOUND:', duplicates);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
