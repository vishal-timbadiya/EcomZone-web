@echo off
node -e "require('fs').rmSync('d:/ecomzone/app/wishlist', {recursive:true,force:true})"
echo Done
