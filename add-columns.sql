-- Run these SQL commands directly in your PostgreSQL database
-- This adds the imageUrl and position columns to Category table if they don't exist

-- Add imageUrl column if it doesn't exist
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT DEFAULT '';

-- Add position column if it doesn't exist  
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;

-- Verify the changes
SELECT * FROM "Category" LIMIT 5;
