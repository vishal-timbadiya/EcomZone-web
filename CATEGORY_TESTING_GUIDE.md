# Category System - Quick Reference & Testing Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Fix Prisma Client (5 minutes)
```bash
cd d:\ecomzone_V2
npx prisma generate
```

### Step 2: Start Dev Server
```bash
npm run dev
```
Then open: http://localhost:3000

### Step 3: Test Everything
Follow the testing checklist below

---

## 📋 Testing Checklist

### ✅ Test 1: Create Category with Image

**Location**: http://localhost:3000/admin/categories

Steps:
1. Fill in "Category Name": `Electronics`
2. Leave Icon as default emoji (or change it)
3. Click "Choose Image" and select a photo
4. Click "Create Category"

Expected Results:
- ✅ Success message appears
- ✅ Category shows in table below
- ✅ Image thumbnail visible in table

**Curl Test** (if you prefer):
```bash
curl -X POST http://localhost:3000/api/admin/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "imageUrl": "data:image/jpeg;base64,..."
  }'
```

---

### ✅ Test 2: View Category on Home Page

**Location**: http://localhost:3000/

Steps:
1. Scroll down to "Categories" section
2. Look for "Electronics" category card
3. Verify the image is showing (not emoji)
4. Click the category card

Expected Results:
- ✅ Category card displays with image
- ✅ Product count shows (e.g., "5 products")
- ✅ Click navigates to category page
- ✅ Product list displays (or "No products" if empty)

**Debug**: Check browser DevTools Console for errors

---

### ✅ Test 3: Reorder Categories

**Location**: http://localhost:3000/admin/categories

Steps:
1. Find category in table
2. Click "↑" button to move up
3. Click "↓" button to move down
4. Refresh home page to verify order

Expected Results:
- ✅ Buttons work without errors
- ✅ Category moves in list
- ✅ Order persists on home page
- ✅ Top category shows "↑" disabled
- ✅ Bottom category shows "↓" disabled

**Network Test**: 
- Open DevTools > Network tab
- Click move button
- Check POST request to `/api/admin/categories/update/[id]`
- Status should be 200 OK

---

### ✅ Test 4: Edit Category

**Location**: http://localhost:3000/admin/categories

Steps:
1. Click "Edit" button on any category
2. Change name to something else
3. Change icon emoji
4. Click "Update Category"

Expected Results:
- ✅ Form fills with current values
- ✅ Changes save successfully
- ✅ Changes visible in table immediately
- ✅ Home page reflects changes

---

### ✅ Test 5: Delete Category

**Location**: http://localhost:3000/admin/categories

Steps:
1. Click "Delete" button
2. Confirm deletion
3. Check home page

Expected Results:
- ✅ Delete confirmation appears
- ✅ Category removed from table
- ✅ Category disappears from home page
- ✅ Error if category has products

**Error Test**: Create a product in a category, then try to delete it
- Expected: "Cannot delete category with X products"

---

### ✅ Test 6: Toggle Active/Inactive

**Location**: http://localhost:3000/admin/categories

Steps:
1. Find category status badge (green "Active" or red "Inactive")
2. Click it
3. Confirm toggle

Expected Results:
- ✅ Status changes
- ✅ Inactive categories hidden from home page
- ✅ Can still edit inactive categories

---

## 🔍 Debugging Guide

### Issue: Admin page shows "0 total categories"

**Step 1**: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh admin page
4. Look for request to `/api/admin/categories`
5. Check response status and data

**Step 2**: Check Console
1. Open DevTools Console
2. Look for errors
3. Check if token is in localStorage: `localStorage.getItem('adminToken')`

**Step 3**: Verify Backend
```bash
curl http://localhost:3000/api/admin/categories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Issue: Reorder buttons return error

**Fix**: Run Prisma generation
```bash
npx prisma generate
```

**Check**: Verify position field exists
```bash
npx prisma introspect
```

---

### Issue: Images not showing on home page

**Debug Steps**:
1. Check database: `SELECT slug, imageUrl FROM categories LIMIT 1;`
2. Verify API: http://localhost:3000/api/categories
3. Check response includes `imageUrl` field
4. Browser console for image load errors

**Hard Refresh**: Ctrl+Shift+R (clears cache)

---

### Issue: Products not showing in category

**Debug Steps**:
1. Check product exists: `/api/categories/electronics`
2. Verify product has category slug
3. Ensure product is active (isActive = true)
4. Check if category slug matches exactly

**Example**:
- Category slug: `electronics` ✅
- Product category: `electronics` ✅
- But: `Electronics` ❌ (case-sensitive)

---

## 📊 API Reference

### Get All Categories
```
GET /api/categories
Response: [{ id, name, slug, icon, imageUrl, productCount, position }]
```

### Get Category Products
```
GET /api/categories/electronics
Response: [{ Product objects with all fields }]
```

### Admin: List Categories
```
GET /api/admin/categories
Headers: Authorization: Bearer TOKEN
Response: { categories: [...] }
```

### Admin: Create Category
```
POST /api/admin/categories
Headers: Authorization: Bearer TOKEN
Body: { name, icon, imageUrl }
Response: { category }
```

### Admin: Update Category
```
PUT /api/admin/categories/update/[id]
Body: { name, icon, imageUrl }
Response: { category }
```

### Admin: Reorder
```
POST /api/admin/categories/update/[id]
Body: { id, direction: "up"|"down" }
Response: { categories: [...] }
```

### Admin: Toggle Active
```
PATCH /api/admin/categories/update/[id]/toggle
Body: { isActive: boolean }
Response: { category }
```

### Admin: Delete
```
DELETE /api/admin/categories/update/[id]
Response: { message }
```

---

## 🗂️ File Locations

**Frontend:**
- Admin Dashboard: `/app/admin/categories/page.tsx`
- Home Page: `/app/categories/CategoriesClient.tsx`
- Category Page: `/app/category/[slug]/page.tsx`

**Backend:**
- Main API: `/app/api/categories/route.ts`
- Category Details: `/app/api/categories/[slug]/route.ts`
- Admin CRUD: `/app/api/admin/categories/route.ts`
- Admin Update: `/app/api/admin/categories/update/[id]/route.ts`

**Database:**
- Schema: `/prisma/schema.prisma`
- Migrations: `/prisma/migrations/`

---

## ⚡ Performance Tips

1. **Images**: Consider image compression before upload
2. **Counts**: Product counts calculated per request (cache if slow)
3. **Caching**: Next.js caches API responses by default
4. **Revalidation**: Manual reorder triggers revalidation

---

## 📝 Notes for Team

- Images stored as base64 (consider S3 for production)
- Categories ordered by `position` field
- Products filtered by category `slug` field
- Admin authentication required for modifications
- All timestamps in UTC

---

## ✨ Success Indicators

When everything works:
- ✅ Admin can create/edit/delete categories
- ✅ Admin can upload images for categories
- ✅ Admin can reorder categories
- ✅ Home page shows categories with images
- ✅ Clicking category shows its products
- ✅ Category order matches admin dashboard order
- ✅ No console errors

---

**Status**: Ready for Testing  
**Last Check**: All code implemented  
**Next Step**: Run `npx prisma generate`
