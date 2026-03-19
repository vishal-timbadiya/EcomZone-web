// Helper script to create directories
const fs = require('fs');
const path = require('path');

const dirs = [
  'd:\\ecomzone_V2\\app\\api\\products\\top-ranking',
  'd:\\ecomzone_V2\\app\\api\\products\\trending',
  'd:\\ecomzone_V2\\app\\api\\products\\new-arrivals'
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created: ${dir}`);
});
