import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  link: string;
  description: string;
}

interface UseYouTubeVideosResult {
  videos: YouTubeVideo[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  search: string;
  setSearch: (search: string) => void;
  refetch: () => void;
  loadMore: () => void;
  total: number;
  hasMore: boolean;
  note: string | null;
}

export const useYouTubeVideos = (): UseYouTubeVideosResult => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  
  // Use ref to avoid recreating fetchVideos when nextPageToken changes
  const nextPageTokenRef = useRef<string | null>(null);
  nextPageTokenRef.current = nextPageToken;

  const fetchVideos = useCallback(
    async (reset: boolean, searchQuery: string) => {
      if (reset) {
        setLoading(true);
        setVideos([]);
        setNextPageToken(null);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("fetch-youtube-videos", {
          body: {
            search: searchQuery,
            limit: 20,
            pageToken: reset ? undefined : nextPageTokenRef.current,
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);

        const incoming: YouTubeVideo[] = data?.videos || [];

        setVideos((prev) => (reset ? incoming : [...prev, ...incoming]));
        setTotal(data?.total || 0);
        setNextPageToken(data?.nextPageToken ?? null);
        setNote(data?.note || null);
      } catch (err) {
        console.error("Error fetching YouTube videos:", err);
        setError(err instanceof Error ? err.message : "Error al cargar videos");
        if (reset) setVideos([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Initial fetch and search changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchVideos(true, search);
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, fetchVideos]);

  const handleLoadMore = useCallback(() => {
    if (!nextPageTokenRef.current) return;
    fetchVideos(false, search);
  }, [fetchVideos, search]);

  return {
    videos,
    loading,
    loadingMore,
    error,
    search,
    setSearch,
    refetch: () => fetchVideos(true, search),
    loadMore: handleLoadMore,
    total,
    hasMore: !!nextPageToken,
    note,
  };
};
