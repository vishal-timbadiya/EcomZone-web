const { spawn } = require('child_process');

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    console.log('🔄 Regenerating Prisma client...');
    await runCommand('npx', ['prisma', 'generate']);
    
    console.log('\n✅ Prisma client regenerated!');
    console.log('\nNow try:');
    console.log('1. Refresh your browser');
    console.log('2. Check /api/admin/categories again');
    console.log('\nIf you still get error, run:');
    console.log('   npx prisma migrate dev --name add_category_image_and_position');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
