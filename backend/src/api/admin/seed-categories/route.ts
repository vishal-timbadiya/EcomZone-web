import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/adminAuth";

const DEFAULT_CATEGORIES = [
  { name: "House Cleaning", icon: "🧹" },
  { name: "Beauty Products", icon: "💄" },
  { name: "Massage Accessory", icon: "💆" },
  { name: "Home Product", icon: "🏠" },
  { name: "Bottle Accessory", icon: "🧴" },
  { name: "Kids Products", icon: "🧸" },
  { name: "Pet Grooming", icon: "🐕" },
  { name: "Mate Accessory", icon: "🧉" },
];

export async function POST(req: Request) {
  try {
    await verifyAdmin(req);

    const createdCategories = [];
    
    for (const cat of DEFAULT_CATEGORIES) {
      const slug = cat.name.toLowerCase().replace(/\s+/g, "-");
      
      // Check if category already exists
      const existing = await prisma.category.findUnique({
        where: { slug },
      });
      
      if (!existing) {
        const category = await prisma.category.create({
          data: {
            name: cat.name,
            slug,
            icon: cat.icon,
            isActive: true,
          },
        });
        createdCategories.push(category);
      }
    }

    return NextResponse.json({
      message: `Created ${createdCategories.length} categories`,
      categories: createdCategories,
    });
  } catch (error: any) {
    console.error("Seed Categories Error:", error.message);
    return NextResponse.json(
      { message: "Error seeding categories", error: error.message },
      { status: 500 }
    );
  }
}

