import { NextResponse } from "next/server";

// Instagram Basic Display API configuration
// You'll need to set these up at https://developers.facebook.com/
const INSTAGRAM_CONFIG = {
  accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  userId: process.env.INSTAGRAM_USER_ID,
};

// Cache for reels data (5 minutes)
let cachedReels: any[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Check cache first
    if (cachedReels && Date.now() - cacheTime < CACHE_DURATION) {
      return NextResponse.json(cachedReels);
    }

    // If no Instagram config, return demo reels
    if (!INSTAGRAM_CONFIG.accessToken || !INSTAGRAM_CONFIG.userId) {
      const demoReels = getDemoReels();
      return NextResponse.json(demoReels);
    }

    // Fetch from Instagram Basic Display API
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,likes_count,comments_count";
    const url = `https://graph.instagram.com/${INSTAGRAM_CONFIG.userId}/media?fields=${fields}&access_token=${INSTAGRAM_CONFIG.accessToken}`;

    const response = await fetch(url, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (!response.ok) {
      console.error("Instagram API error:", await response.text());
      return NextResponse.json(getDemoReels());
    }

    const data = await response.json();
    
    // Filter only VIDEO type (Reels)
    const reels = (data.data || [])
      .filter((item: any) => item.media_type === "VIDEO")
      .map((item: any) => ({
        id: item.id,
        thumbnail: item.thumbnail_url || item.media_url,
        title: item.caption?.substring(0, 50) || "Instagram Reel",
        videoUrl: item.permalink,
        likes: item.likes_count || 0,
        comments: item.comments_count || 0,
      }));

    // Update cache
    cachedReels = reels;
    cacheTime = Date.now();

    return NextResponse.json(reels);
  } catch (error) {
    console.error("Error fetching Instagram reels:", error);
    return NextResponse.json(getDemoReels());
  }
}

function getDemoReels() {
  return [
    {
      id: "1",
      thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=533&fit=crop",
      title: "New Arrivals - Check Out Our Latest Products",
      videoUrl: "https://instagram.com/reel/",
      likes: 120,
      comments: 15
    },
    {
      id: "2", 
      thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=533&fit=crop",
      title: "Best Sellers - Customer Favorites",
      videoUrl: "https://instagram.com/reel/",
      likes: 89,
      comments: 8
    },
    {
      id: "3",
      thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=533&fit=crop", 
      title: "Trending Now - Hot Products",
      videoUrl: "https://instagram.com/reel/",
      likes: 256,
      comments: 32
    },
    {
      id: "4",
      thumbnail: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=533&fit=crop",
      title: "Special Deals - Limited Time Offers",
      videoUrl: "https://instagram.com/reel/",
      likes: 178,
      comments: 24
    },
    {
      id: "5",
      thumbnail: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=300&h=533&fit=crop",
      title: "New Launch - Just Dropped",
      videoUrl: "https://instagram.com/reel/",
      likes: 312,
      comments: 45
    },
  ];
}

