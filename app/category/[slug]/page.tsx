import CategoryClient from "./CategoryClient";

export async function generateStaticParams() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  try {
    const res = await fetch(`${apiUrl}/categories`, { cache: "force-cache" });
    if (res.ok) {
      const data = await res.json();
      const categories = Array.isArray(data) ? data : data.categories || [];
      const slugs = categories.map((cat: { slug: string }) => ({ slug: cat.slug }));
      if (slugs.length > 0) return slugs;
    }
  } catch {
    // API unavailable at build time
  }
  // Fallback: ensures output:export does not fail when API is offline at build time
  return [{ slug: "all" }];
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryClient slug={slug} />;
}
