import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Youtube } from "lucide-react";

interface YouTubeChannelProps {
  onBack: () => void;
}

const CHANNEL_URL = "https://youtube.com/@marcelacocina";
const CHANNEL_ID = "marcelacocina";
const PRESENTATION_VIDEO_ID = "KbcJ5AYgPIQ";

export const YouTubeChannel = ({ onBack }: YouTubeChannelProps) => {
  const openInYouTube = () => {
    window.open(CHANNEL_URL, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Button
          variant="outline"
          onClick={openInYouTube}
          className="flex items-center gap-2"
        >
          <Youtube className="h-4 w-4 text-red-500" />
          Abrir canal en YouTube
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Channel Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Youtube className="h-10 w-10 text-red-500" />
          <h1 className="text-3xl font-bold">Mi Canal</h1>
        </div>
        <p className="text-muted-foreground">
          Videos de cocina de @{CHANNEL_ID}
        </p>
      </div>

      {/* Presentation Video */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${PRESENTATION_VIDEO_ID}`}
              title="Presentación del canal"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </CardContent>
      </Card>

      {/* Channel Link Card */}
      <Card className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/20">
        <CardContent className="p-6 text-center space-y-4">
          <Youtube className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">@{CHANNEL_ID}</h3>
            <p className="text-muted-foreground text-sm">
              Suscribite para más recetas y tips de cocina
            </p>
          </div>
          <Button
            onClick={openInYouTube}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Youtube className="h-4 w-4 mr-2" />
            Ir al canal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
