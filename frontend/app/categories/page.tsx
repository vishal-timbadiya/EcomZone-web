import { Metadata } from "next";
import CategoriesClient from "./CategoriesClient";

export const metadata: Metadata = {
  title: "All Categories - Shop by Category | EcomZone",
  description: "Browse all product categories at EcomZone. Find the best products in House Cleaning, Beauty Products, Home Products, and more.",
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}

