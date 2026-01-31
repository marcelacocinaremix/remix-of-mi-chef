import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Channel ID for @marcelacocina - Marcela's kitchen
const CHANNEL_ID = "UCQA9kkR9Tr3b06QY-iy7oTQ";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  link: string;
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { search, pageToken, limit = 20 } = await req.json().catch(() => ({}));
    
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!YOUTUBE_API_KEY) {
      console.error('YOUTUBE_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'YouTube API key not configured',
          videos: [],
          total: 0,
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let videos: VideoItem[] = [];
    let nextPageToken: string | null = null;
    let totalResults = 0;

    if (search && search.trim()) {
      // Use search endpoint when searching
      const searchParams = new URLSearchParams({
        part: 'snippet',
        channelId: CHANNEL_ID,
        q: search,
        type: 'video',
        maxResults: String(limit),
        order: 'relevance',
        key: YOUTUBE_API_KEY,
      });

      if (pageToken) {
        searchParams.set('pageToken', pageToken);
      }

      const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams}`;
      console.log('Fetching YouTube search:', searchUrl.replace(YOUTUBE_API_KEY, '***'));

      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API error:', response.status, errorText);
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      videos = data.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
        link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        description: item.snippet.description,
      })) || [];

      nextPageToken = data.nextPageToken || null;
      totalResults = data.pageInfo?.totalResults || videos.length;

    } else {
      // Get channel uploads playlist first
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
      console.log('Fetching channel info');
      
      const channelResponse = await fetch(channelUrl);
      
      if (!channelResponse.ok) {
        const errorText = await channelResponse.text();
        console.error('YouTube API channel error:', channelResponse.status, errorText);
        throw new Error(`YouTube API error: ${channelResponse.status}`);
      }

      const channelData = await channelResponse.json();
      const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        throw new Error('Could not find uploads playlist');
      }

      // Fetch videos from uploads playlist
      const playlistParams = new URLSearchParams({
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: String(limit),
        key: YOUTUBE_API_KEY,
      });

      if (pageToken) {
        playlistParams.set('pageToken', pageToken);
      }

      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?${playlistParams}`;
      console.log('Fetching playlist items');

      const playlistResponse = await fetch(playlistUrl);
      
      if (!playlistResponse.ok) {
        const errorText = await playlistResponse.text();
        console.error('YouTube API playlist error:', playlistResponse.status, errorText);
        throw new Error(`YouTube API error: ${playlistResponse.status}`);
      }

      const playlistData = await playlistResponse.json();

      videos = playlistData.items?.map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
        link: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        description: item.snippet.description,
      })) || [];

      nextPageToken = playlistData.nextPageToken || null;
      totalResults = playlistData.pageInfo?.totalResults || videos.length;
    }

    console.log(`Returning ${videos.length} videos, total: ${totalResults}`);

    return new Response(
      JSON.stringify({
        videos,
        total: totalResults,
        nextPageToken,
        hasMore: !!nextPageToken,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        videos: [],
        total: 0,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
