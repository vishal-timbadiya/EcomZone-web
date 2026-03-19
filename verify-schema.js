const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndMigrate() {
  try {
    console.log('\n=== CHECKING DATABASE SCHEMA ===\n');
    
    // Try to get categories
    const categories = await prisma.category.findMany({ take: 1 });
    
    if (categories.length === 0) {
      console.log('✅ No categories yet - schema is OK');
    } else {
      const cat = categories[0];
      console.log('Sample category:', JSON.stringify(cat, null, 2));
      
      // Check for missing fields
      if (!('imageUrl' in cat)) {
        console.log('\n❌ Missing imageUrl column');
      } else {
        console.log('✅ imageUrl field exists');
      }
      
      if (!('position' in cat)) {
        console.log('\n❌ Missing position column');
      } else {
        console.log('✅ position field exists');
      }
    }

    console.log('\n=== ALL CATEGORIES ===');
    const allCats = await prisma.category.findMany();
    console.log(`Total: ${allCats.length}`);
    allCats.forEach(cat => {
      console.log(`- ${cat.name} (slug: ${cat.slug}, active: ${cat.isActive})`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndMigrate();
