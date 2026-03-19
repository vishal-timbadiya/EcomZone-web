# 🧪 BULK LISTING FEATURE - TESTING GUIDE

## Quick Test Checklist

### **Test 1: ZIP Upload with Images**

**Preparation:**
```
Create test structure:
test-products.zip
├── PROD001/
│   ├── image1.jpg
│   └── image2.jpg
├── PROD002/
│   └── main.jpg
└── PROD003/
    ├── photo1.jpg
    └── photo2.jpg
```

**Steps:**
- [ ] Open Products → Bulk Import
- [ ] Select "ZIP with Images"
- [ ] Upload test-products.zip
- [ ] Wait for processing (10-20s)
- [ ] Verify alert shows "3 products found"
- [ ] Click "Download CSV Template"
- [ ] CSV downloads successfully
- [ ] Open CSV, verify:
  - [ ] productCode pre-filled (PROD001, PROD002, PROD003)
  - [ ] imageUrl column has URLs
  - [ ] imageUrls shows all image URLs

**Expected Result:** ✅ Pass

---

### **Test 2: Edit CSV and Upload Back**

**Steps:**
- [ ] Edit downloaded CSV with:
  ```
  PROD001, Nike Shoes, 5999, Premium shoes, Footwear
  PROD002, Cotton Shirt, 999, Casual shirt, Clothing
  PROD003, Blue Jeans, 2499, Classic denim, Clothing
  ```
- [ ] Save CSV file
- [ ] Upload completed CSV
- [ ] See preview table with 3 products
- [ ] Click "Import 3 Products"
- [ ] Wait for completion (5-10s)
- [ ] See completion stats: "✅ 3 Added"
- [ ] Check Products list - 3 new products appear

**Expected Result:** ✅ Pass

---

### **Test 3: Direct CSV Import**

**Preparation:**
```
Create products.csv:

productCode,name,singlePrice,description,category
CSV001,Adidas Shoes,6999,Running shoes,Footwear
CSV002,Polo Shirt,1499,Casual wear,Clothing
CSV003,Sports Shorts,799,Summer wear,Clothing
```

**Steps:**
- [ ] Open Products → Bulk Import
- [ ] Select "CSV Import"
- [ ] Upload products.csv
- [ ] See preview with 3 products
- [ ] Click "Import 3 Products"
- [ ] Wait for completion
- [ ] See completion stats: "✅ 3 Added"
- [ ] Products appear in list

**Expected Result:** ✅ Pass

---

### **Test 4: Upsert (Update Existing)**

**Setup:**
- From Test 2, you have 3 products (PROD001, PROD002, PROD003)

**Preparation:**
Create update.csv with:
```
productCode,name,singlePrice,description,category
PROD001, Nike Air Max, 7999, Updated premium shoes, Footwear
PROD002, Cotton Casual, 1199, Updated casual shirt, Clothing
NEW001, New Product, 1899, Brand new product, Fashion
```

**Steps:**
- [ ] Upload update.csv
- [ ] See preview with 3 products
- [ ] Click "Import 3 Products"
- [ ] See completion stats:
  - [ ] "🔄 2 Updated" (PROD001, PROD002)
  - [ ] "➕ 1 Added" (NEW001)
- [ ] Check Products list:
  - [ ] PROD001 shows new price (7999)
  - [ ] PROD002 shows new price (1199)
  - [ ] NEW001 appears as new product

**Expected Result:** ✅ Pass

---

### **Test 5: Error Handling**

**Scenario A: Missing Required Field**

Preparation:
```
invalid.csv:

productCode,name,singlePrice
PROD001,No Price Field,           ← Missing singlePrice!
```

**Steps:**
- [ ] Upload invalid.csv
- [ ] See validation error in preview
- [ ] Or see error in completion stats
- [ ] Error message explains issue

**Expected Result:** ✅ Error handled gracefully

**Scenario B: Duplicate in Direct CSV**

Preparation:
```
duplicates.csv:

productCode,name,singlePrice,description,category
DUP001,Product A,999,Test,Clothing
DUP001,Product B,1999,Test,Clothing   ← Duplicate code!
```

**Steps:**
- [ ] Upload duplicates.csv
- [ ] See preview (or error message)
- [ ] One product imported, one skipped with error
- [ ] Completion shows: "1 Added, 1 Error"

**Expected Result:** ✅ Partial success handled

---

### **Test 6: Workflow Progress Indicator**

**Steps:**
- [ ] Open Bulk Import modal
- [ ] Verify step numbers show at top: 1 2 3 4 5
- [ ] Click "ZIP with Images" → Step 1 shows ✅
- [ ] Upload ZIP → Step 2 shows ✅
- [ ] After processing → Step 3 shows ✅
- [ ] After CSV uploaded → Step 4 shows ✅
- [ ] After import completes → Step 5 shows ✅

**Expected Result:** ✅ Progress indicator works

---

### **Test 7: Product List Auto-Refresh**

**Setup:**
- [ ] Have products in list
- [ ] Open Bulk Import modal (modal stays on screen)
- [ ] Import 5 new products

**Steps:**
- [ ] See completion screen
- [ ] Click "All Done!"
- [ ] Check if product list refreshes with new products
- [ ] Verify new products are visible

**Expected Result:** ✅ List refreshes automatically

---

### **Test 8: Large Batch (Performance)**

**Preparation:**
```
Create CSV with 100 products:

productCode,name,singlePrice,description,category
BATCH001,Product 1,999,Test,Category
BATCH002,Product 2,999,Test,Category
...
BATCH100,Product 100,999,Test,Category
```

**Steps:**
- [ ] Upload 100-product CSV
- [ ] Time the preview: < 5 seconds
- [ ] Time the import: < 30 seconds
- [ ] Completion shows: "✅ 100 Added"
- [ ] All 100 products created successfully

**Expected Result:** ✅ Performance acceptable

---

### **Test 9: Mobile Responsiveness**

**Steps (on mobile/tablet):**
- [ ] Open Bulk Import modal
- [ ] Verify modal fits on screen
- [ ] Test file upload button
- [ ] Test CSV download
- [ ] Verify preview table scrolls
- [ ] Test action buttons
- [ ] Verify completion screen displays well

**Expected Result:** ✅ Mobile friendly

---

### **Test 10: Error Recovery**

**Scenario: Network Error**

**Steps:**
- [ ] Start import (upload CSV)
- [ ] Simulate network error (turn off wifi during upload)
- [ ] See error message
- [ ] Recover (turn wifi back on)
- [ ] Retry import
- [ ] Should work without issues

**Expected Result:** ✅ Graceful error recovery

---

## Quick Smoke Test (5 minutes)

```bash
# 1. ZIP Test
- Upload 3-folder ZIP → Download CSV → Edit → Upload → Import
- Verify: 3 products created ✅

# 2. CSV Test
- Create simple 3-product CSV → Upload → Import
- Verify: 3 products created ✅

# 3. Progress Test
- Check workflow indicator shows steps 1-5 ✅

# 4. Auto-Refresh Test
- Import products → Verify product list shows new items ✅

Total Time: ~5 minutes
Result: All features working ✅
```

---

## Common Issues & Fixes

### **Issue: "Preview failed" error**
**Fix:** Ensure CSV has required fields (productCode, name, singlePrice)

### **Issue: CSV download doesn't work**
**Fix:** Check browser downloads folder, clear browser cache

### **Issue: Products not appearing in list**
**Fix:** Refresh page with F5, check product status (active/inactive)

### **Issue: Images not showing**
**Fix:** Ensure images are valid (JPG, PNG), check image URLs in CSV

### **Issue: ZIP extraction fails**
**Fix:** Ensure ZIP structure is correct: FolderName/image.jpg

---

## Verification Checklist

**Before Declaring Ready:**
- [ ] Step 1: Method selection works
- [ ] Step 2: File upload accepts ZIP and CSV
- [ ] Step 3: CSV download works, preview displays correctly
- [ ] Step 4: CSV re-upload validates correctly
- [ ] Step 5: Import creates/updates products
- [ ] Completion stats display accurately
- [ ] Product list refreshes automatically
- [ ] Progress indicator works
- [ ] Error handling graceful
- [ ] Mobile responsive
- [ ] Performance acceptable (100+ products < 30s)

**All items checked? → READY FOR PRODUCTION ✅**

---

## Test Data Downloads

### ZIP Structure (Download & Extract):
```
PROD_TEST_001/
├── image1.jpg (500x500 min)
├── image2.jpg
PROD_TEST_002/
├── photo.jpg
```

### CSV Template:
```
productCode,name,singlePrice,description,category,stock,gstPercentage
PROD001,Test Product,999,Test description,Test,100,18
PROD002,Another Product,1999,Another description,Test,100,18
```

---

## Expected Performance Metrics

| Operation | Expected Time | Acceptable Range |
|-----------|---------------|-----------------|
| ZIP Upload (50 MB) | 10s | 5-20s |
| CSV Download | <1s | Instant |
| CSV Validation (100 products) | 2s | 1-5s |
| Database Import (100 products) | 8s | 5-15s |
| **Total End-to-End** | ~30s | 20-60s |

---

## Success Criteria

✅ **All Steps Complete**
- User can upload ZIP, download CSV, edit, upload, and import

✅ **Data Accurate**
- All products created with correct data
- Images linked properly
- Prices and descriptions correct

✅ **Performance Good**
- Response times acceptable
- No lag in UI
- Handles 100+ products

✅ **Error Handling**
- Clear error messages
- Graceful recovery
- Partial success supported

✅ **User Experience**
- Progress visible
- Next steps clear
- Animations smooth
- Mobile responsive

---

## Final Sign-Off

When all tests pass:
- Feature is **PRODUCTION READY** ✅
- Can be deployed to live server ✅
- Users can bulk import products ✅
