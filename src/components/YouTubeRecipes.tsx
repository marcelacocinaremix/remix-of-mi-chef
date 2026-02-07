import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, ExternalLink, Play, Search, Youtube } from "lucide-react";
import { useYouTubeVideos, YouTubeVideo } from "@/hooks/useYouTubeVideos";

interface YouTubeRecipesProps {
  onBack: () => void;
}

const VideoCard = ({
  video,
  onPlay,
}: {
  video: YouTubeVideo;
  onPlay: (video: YouTubeVideo) => void;
}) => {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onClick={() => onPlay(video)}
    >
      <div className="relative aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-red-600 rounded-full p-3">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          <Youtube className="w-3 h-3 inline mr-1" />
          Video
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
      </CardContent>
    </Card>
  );
};

export const YouTubeRecipes = ({ onBack }: YouTubeRecipesProps) => {
  const {
    videos,
    loading,
    loadingMore,
    error,
    search,
    setSearch,
    total,
    hasMore,
    loadMore,
    note,
  } = useYouTubeVideos();

  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const openInYouTube = () => {
    window.open("https://youtube.com/@marcelacocina", "_blank");
  };

  const resultsText = useMemo(() => {
    if (loading) return null;
    if (error) return null;
    if (!videos.length) return null;

    if (total > 0) {
      return `${videos.length} de ${total} videos`;
    }

    return `${videos.length} ${videos.length === 1 ? "video" : "videos"}`;
  }, [loading, error, videos.length, total]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Button variant="outline" onClick={openInYouTube} className="flex items-center gap-2">
          <Youtube className="h-4 w-4 text-red-500" />
          Ver canal completo
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Youtube className="h-10 w-10 text-red-500" />
          <h1 className="text-2xl sm:text-3xl font-bold">Recetas de Marcelacocina</h1>
        </div>
        <p className="text-muted-foreground">Videos de cocina del canal de YouTube</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar recetas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Note removed - only showing results count */}

      {/* Results count */}
      {resultsText && <p className="text-sm text-muted-foreground text-center">{resultsText}</p>}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Cargando videos…</p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {!loading && error && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <h3 className="font-semibold">No se pudieron cargar los videos</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={openInYouTube}>
              <Youtube className="h-4 w-4 mr-2 text-red-500" />
              Ver canal completo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Videos grid */}
      {!loading && !error && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onPlay={setSelectedVideo} />
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && !error && hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Cargando…" : "Cargar más"}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && videos.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <Youtube className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-semibold">No se encontraron videos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Probá con otra búsqueda" : "No hay videos disponibles"}
              </p>
            </div>
            <Button variant="outline" onClick={openInYouTube}>
              <Youtube className="h-4 w-4 mr-2 text-red-500" />
              Ver canal completo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CTA Card */}
      <Card className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/20">
        <CardContent className="p-6 text-center space-y-4">
          <Youtube className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">@marcelacocina</h3>
            <p className="text-muted-foreground text-sm">Suscribite para más recetas y tips de cocina</p>
          </div>
          <Button onClick={openInYouTube} className="bg-red-500 hover:bg-red-600 text-white">
            <Youtube className="h-4 w-4 mr-2" />
            Ir al canal
          </Button>
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedVideo && (
            <div className="space-y-0">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4 space-y-2">
                <h2 className="font-semibold text-lg">{selectedVideo.title}</h2>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedVideo.link, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver en YouTube
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
