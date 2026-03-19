# CSV Upload + Upsert Flow Test

## Step-by-Step Verification:

### 1. ✅ Backend Endpoint Created
- File: `/app/api/admin/products/bulk-upsert/route.ts`
- Logic: Upsert (create new OR update existing by productCode)
- Auth: Requires admin token
- Response: { added, updated, total, errors, message }

### 2. ✅ Frontend States Added
- `isZipCsvUpload`: Detects CSV upload after ZIP
- `completionStats`: Stores import results
- `zipProcessed`: Tracks ZIP processing state
- `file`: Stores selected file

### 3. ✅ Event Handlers Implemented
- handleFileChange: Detects CSV after ZIP
- handlePreview: Shows data preview
- handleImport: Routes to bulk-upsert or bulk-save
- handleZipImport: Processes ZIP

### 4. ✅ UI Components Ready
- Step 6 Label: "Step 6: Upload Completed CSV"
- Preview Button: Shows when file selected
- Import Button: Shows when preview ready
- Completion Screen: Shows added/updated counts

### 5. ✅ Complete Flow
1. Choose ZIP import
2. Upload ZIP → Extract images
3. Download CSV template
4. Fill CSV with product data
5. Upload filled CSV → Preview
6. Click Import → Call bulk-upsert
7. Show completion stats

