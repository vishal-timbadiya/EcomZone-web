import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || ""; // Optional override
const CHANNEL_NAME = "ecomzone21"; // @ecomzone21

// Cache for shorts (15 minutes)
let cachedShorts: any[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Demo fallback
function getDemoShorts() {
  return [
    {
      id: "demo1",
      thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=320&h=568&fit=crop",
      title: "New Arrivals Just Dropped! 🔥",
      videoUrl: "https://youtube.com/shorts/demo1",
      likes: 2450,
      comments: 156
    },
    {
      id: "demo2", 
      thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=320&h=568&fit=crop",
      title: "Top 5 Best Sellers This Week",
      videoUrl: "https://youtube.com/shorts/demo2",
      likes: 1890,
      comments: 89
    },
    {
      id: "demo3",
      thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=320&h=568&fit=crop", 
      title: "Insane Flash Sale Live Now! ⏰",
      videoUrl: "https://youtube.com/shorts/demo3",
      likes: 5670,
      comments: 423
    },
    {
      id: "demo4",
      thumbnail: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=320&h=568&fit=crop",
      title: "Unboxing Our Latest Products",
      videoUrl: "https://youtube.com/shorts/demo4",
      likes: 3340,
      comments: 278
    },
    {
      id: "demo5",
      thumbnail: "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=320&h=568&fit=crop",
      title: "Customer Favorites Under $50",
      videoUrl: "https://youtube.com/shorts/demo5",
      likes: 4120,
      comments: 301
    },
  ];
}

export async function GET() {
  try {
    // Check cache first
    if (cachedShorts && Date.now() - cacheTime < CACHE_DURATION) {
      return NextResponse.json(cachedShorts);
    }

    if (!YOUTUBE_API_KEY) {
      console.warn("YOUTUBE_API_KEY not set, using demo shorts");
      return NextResponse.json(getDemoShorts());
    }

    let channelId = YOUTUBE_CHANNEL_ID;
    
    // If no channel ID, search by name/handle
    if (!channelId) {
      const channelSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(CHANNEL_NAME)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
      const channelRes = await fetch(channelSearchUrl);
      if (!channelRes.ok) throw new Error(`Channel search failed: ${channelRes.status}`);
      
      const channelData = await channelRes.json();
      if (!channelData.items?.[0]) throw new Error("Channel 'ecomzone21' not found");
      
      channelId = channelData.items[0].snippet.channelId;
    }

    // Get channel details for uploads playlist
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const channelRes = await fetch(channelUrl);
    if (!channelRes.ok) throw new Error(`Channel fetch failed: ${channelRes.status}`);
    
    const channelData = await channelRes.json();
    const uploadsPlaylistId = channelData.items[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) throw new Error("No uploads playlist found");

    // Get recent shorts from uploads playlist (videos <60s)
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${YOUTUBE_API_KEY}`;
    const playlistRes = await fetch(playlistUrl);
    if (!playlistRes.ok) throw new Error(`Playlist fetch failed: ${playlistRes.status}`);
    
    const playlistData = await playlistRes.json();
    const videoIds = playlistData.items
      ?.map((item: any) => item.snippet.resourceId.videoId)
      ?.filter(Boolean)
      ?.slice(0, 10) || [];

    if (videoIds.length === 0) return NextResponse.json(getDemoShorts());

    // Get video details (thumbnails, stats, duration for shorts filter)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
    const videosRes = await fetch(videosUrl);
    if (!videosRes.ok) throw new Error(`Videos fetch failed: ${videosRes.status}`);
    
    const videosData = await videosRes.json();
    
    // Filter shorts (<60s) and map
    const shorts = videosData.items
      ?.filter((video: any) => {
        const duration = video.contentDetails.duration; // PTxxS -> xx seconds
        const seconds = parseInt(duration.replace(/PT|S/gi, ''));
        return seconds <= 60;
      })
      .map((video: any) => ({
        id: video.id,
        thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url || '',
        title: video.snippet.title.substring(0, 50) || "YouTube Short",
        videoUrl: `https://youtube.com/shorts/${video.id}`,
        likes: parseInt(video.statistics?.likeCount || '0'),
        comments: parseInt(video.statistics?.commentCount || '0'),
      }))
      .slice(0, 5) || []; // Max 5 like original

    const result = shorts.length > 0 ? shorts : getDemoShorts();

    // Update cache
    cachedShorts = result;
    cacheTime = Date.now();

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error fetching YouTube shorts:", error);
    return NextResponse.json(getDemoShorts());
  }
}

