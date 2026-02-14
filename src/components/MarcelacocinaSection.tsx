import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Youtube, Instagram, Users, ChefHat, Heart, Sparkles } from "lucide-react";
import marcelaKitchen from "@/assets/marcela-kitchen.jpg";
import marcelaMilestone from "@/assets/marcela-youtube-milestone.jpg";

const CHANNEL_URL = "https://youtube.com/@marcelacocina";
const CHANNEL_ID = "marcelacocina";
const INSTAGRAM_URL = "https://instagram.com/marcelacocina_ok";
const PRESENTATION_VIDEO_ID = "KbcJ5AYgPIQ";

export const MarcelacocinaSection = () => {
  const openInYouTube = () => {
    window.open(CHANNEL_URL, "_blank");
  };

  const openInInstagram = () => {
    window.open(INSTAGRAM_URL, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <ChefHat className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold">Marcelacocina</h1>
        </div>
        <p className="text-muted-foreground">
          Conocé más sobre el canal y el proyecto
        </p>
      </div>

      {/* Sobre Marcela */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            ¡Hola! Soy Marcela
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Me llamo <strong>Marcela</strong> y soy una entusiasta de la cocina y la creatividad culinaria. 
            ¡Estoy muy emocionada de compartir con ustedes mi amor por la cocina!
          </p>
          <p className="text-muted-foreground leading-relaxed">
            En mi canal de YouTube <strong>marcelacocina</strong> y mi cuenta de Instagram <strong>@marcelacocina_ok</strong> encontrarán 
            recetas para todos los gustos y paladares, desde deliciosos platos saludables hasta recetas rápidas, fáciles y nutritivas.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            ¡Todas mis recetas están diseñadas para que sean simples de preparar, para que puedan disfrutar de comidas deliciosas 
            sin tener que pasar mucho tiempo en la cocina!
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Además de mis recetas, también publico consejos útiles sobre cómo comer mejor, cómo preparar comidas saludables 
            y cómo mantenerse en forma. ¡Los invito a unirse a mi comunidad! 💕
          </p>
        </CardContent>
      </Card>

      {/* Galería de fotos */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <img 
            src={marcelaKitchen} 
            alt="Marcela en su cocina con sus creaciones" 
            className="w-full h-64 object-cover object-top"
          />
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Marcela en su cocina, lista para compartir nuevas recetas 🍰
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <img 
            src={marcelaMilestone} 
            alt="Celebrando 30.000 suscriptores en YouTube" 
            className="w-full h-64 object-cover object-top"
          />
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              ¡Celebrando 30.000 suscriptores en YouTube! 🎉
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quiénes Somos - Mi Chef */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            Sobre Mi Chef
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            <strong>Mi Chef</strong> es un asistente de cocina personal creado por <strong>Marcelacocina</strong>, 
            un proyecto dedicado a hacer la cocina más accesible y divertida para todos.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Con la ayuda de inteligencia artificial, te ayudamos a crear recetas deliciosas 
            con los ingredientes que tenés en casa, optimizando tu tiempo y reduciendo el desperdicio de alimentos.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
            <Heart className="h-4 w-4 text-red-500" />
            <span>Hecho con amor desde Argentina 🇦🇷</span>
          </div>
        </CardContent>
      </Card>

      {/* Video de Presentación */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Video de Presentación
          </CardTitle>
        </CardHeader>
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

      {/* Redes Sociales */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* YouTube Card */}
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
              className="bg-red-500 hover:bg-red-600 text-white w-full"
            >
              <Youtube className="h-4 w-4 mr-2" />
              Ir al canal
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Instagram Card */}
        <Card className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 border-pink-500/20">
          <CardContent className="p-6 text-center space-y-4">
            <Instagram className="h-12 w-12 text-pink-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">@marcelacocina_ok</h3>
              <p className="text-muted-foreground text-sm">
                Seguinos para más contenido diario
              </p>
            </div>
            <Button
              onClick={openInInstagram}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white w-full"
            >
              <Instagram className="h-4 w-4 mr-2" />
              Ir a Instagram
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Próximamente */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center space-y-2">
          <h3 className="text-lg font-semibold text-muted-foreground">🚀 Próximamente</h3>
          <p className="text-sm text-muted-foreground">
            Videos integrados, tutoriales exclusivos y más contenido para vos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
