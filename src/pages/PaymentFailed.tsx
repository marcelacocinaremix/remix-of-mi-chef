import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, Home } from "lucide-react";

export default function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl p-8 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-destructive" />
        </div>

        <h1 className="text-2xl font-display font-bold text-foreground">
          Pago no completado
        </h1>
        
        <p className="text-muted-foreground">
          Hubo un problema con tu pago o fue cancelado. No te preocupes, no se realizó ningún cargo.
        </p>

        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/')}
            size="lg"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar de nuevo
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Si el problema persiste, contactanos a soporte@michef.app
        </p>
      </div>
    </div>
  );
}