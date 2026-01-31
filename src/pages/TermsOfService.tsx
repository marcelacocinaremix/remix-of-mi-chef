import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <h1 className="text-3xl font-display font-bold text-foreground mb-6">
          Términos y Condiciones
        </h1>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <p><strong>Última actualización:</strong> {new Date().toLocaleDateString('es-AR')}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">1. Aceptación de términos</h2>
            <p>Al usar Mi Chef by Marcela Cocina, aceptás estos términos y condiciones. Si no estás de acuerdo, por favor no uses la aplicación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">2. Descripción del servicio</h2>
            <p>Mi Chef es una aplicación que genera recetas personalizadas basadas en los ingredientes que tenés disponibles, usando inteligencia artificial.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">3. Uso aceptable</h2>
            <p>Te comprometés a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usar la app solo para fines personales y no comerciales.</li>
              <li>No intentar acceder a sistemas o datos de otros usuarios.</li>
              <li>No usar la app para actividades ilegales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">4. Contenido generado</h2>
            <p>Las recetas son generadas por inteligencia artificial. Si bien nos esforzamos por brindar información precisa:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>No garantizamos la exactitud de las recetas.</li>
              <li>Usá tu criterio al cocinar, especialmente con alergias o restricciones dietarias.</li>
              <li>No somos responsables por resultados de seguir las recetas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">5. Propiedad intelectual</h2>
            <p>El contenido, diseño y marca de Mi Chef son propiedad de Marcela Cocina. Las recetas generadas pueden ser usadas libremente para uso personal.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">6. Limitación de responsabilidad</h2>
            <p>La app se proporciona "tal cual". No garantizamos disponibilidad continua ni ausencia de errores.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">7. Modificaciones</h2>
            <p>Podemos actualizar estos términos. Te notificaremos de cambios importantes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">8. Contacto</h2>
            <p>Para consultas: <strong>marcelacocina@gmail.com</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
}
