const fs = require('fs');
const path = require('path');

const dirPath = 'd:\\ecomzone_V2\\app\\api\\categories\\[slug]';

try {
  fs.mkdirSync(dirPath, { recursive: true });
  console.log('✓ Directory created successfully:', dirPath);
} catch (error) {
  console.error('✗ Error creating directory:', error.message);
  process.exit(1);
}
