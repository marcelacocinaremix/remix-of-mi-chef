import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <h1 className="text-3xl font-display font-bold text-foreground mb-6">
          Política de Privacidad
        </h1>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-AR')}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">1. Información que recopilamos</h2>
            <p>Mi Chef by Marcela Cocina recopila la siguiente información:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Información de cuenta:</strong> Email y nombre para crear tu perfil.</li>
              <li><strong>Datos de uso:</strong> Recetas favoritas, ingredientes guardados en tu despensa, historial de recetas cocinadas.</li>
              <li><strong>Imágenes:</strong> Fotos que subas para detectar ingredientes (procesadas pero no almacenadas permanentemente).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">2. Cómo usamos tu información</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Personalizar las recetas según tus preferencias.</li>
              <li>Guardar tus recetas favoritas y despensa.</li>
              <li>Mejorar la experiencia de la aplicación.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">3. Compartir información</h2>
            <p>No vendemos ni compartimos tu información personal con terceros, excepto:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Servicios de infraestructura (almacenamiento seguro de datos).</li>
              <li>Cuando sea requerido por ley.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">4. Seguridad de datos</h2>
            <p>Utilizamos medidas de seguridad estándar de la industria para proteger tu información, incluyendo encriptación y acceso restringido.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">5. Tus derechos</h2>
            <p>Podés:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acceder a tus datos personales.</li>
              <li>Solicitar la eliminación de tu cuenta y datos.</li>
              <li>Modificar tu información de perfil.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">6. Contacto</h2>
            <p>Para consultas sobre privacidad, contactanos en: <strong>marcelacocina@gmail.com</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
}
