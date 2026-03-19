const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('\n=== CHECKING CATEGORY TABLE ===\n');
    
    // Try to get a category and see what fields it has
    const categories = await prisma.category.findMany({ take: 1 });
    
    if (categories.length === 0) {
      console.log('✅ No categories in database - clean state');
    } else {
      console.log('✅ Categories found:', JSON.stringify(categories[0], null, 2));
    }

    // Try to get raw categories from database
    const rawCategories = await prisma.$queryRaw`SELECT * FROM "Category" LIMIT 1`;
    console.log('\n✅ Raw database query:', JSON.stringify(rawCategories, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n⚠️  Category table may not exist or schema mismatch');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
