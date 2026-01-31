import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import marcelaImage from "@/assets/marcela-character.png";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

interface VoiceIngredientInputProps {
  open: boolean;
  onClose: () => void;
  onIngredientsDetected: (ingredients: string[]) => void;
}

// Common Spanish ingredient keywords to detect
const INGREDIENT_KEYWORDS = [
  "pollo", "carne", "pescado", "huevo", "huevos", "leche", "queso", "manteca",
  "pan", "arroz", "fideos", "pasta", "tomate", "cebolla", "ajo", "papa", "papas",
  "zanahoria", "lechuga", "espinaca", "acelga", "pimiento", "morron", "calabaza",
  "zapallo", "choclo", "maiz", "poroto", "lentejas", "garbanzo", "harina", "azucar",
  "sal", "pimienta", "aceite", "vinagre", "limon", "naranja", "manzana", "banana",
  "frutilla", "durazno", "pera", "uva", "cerdo", "jamon", "salchicha", "chorizo",
  "atun", "salmon", "merluza", "camarones", "mejillones", "pulpo", "calamar",
  "yogur", "crema", "ricota", "mozzarella", "parmesano", "provolone",
  "albahaca", "oregano", "perejil", "cilantro", "romero", "tomillo", "laurel",
  "canela", "jengibre", "curry", "comino", "pimenton", "mostaza", "mayonesa",
  "ketchup", "salsa", "caldo", "cerveza", "vino", "chocolate", "cacao", "cafe",
  "te", "miel", "mermelada", "dulce", "galletitas", "avena", "cereales",
  "almendra", "nuez", "mani", "semillas", "palta", "brocoli", "coliflor",
  "berenjena", "zucchini", "pepino", "rabanito", "remolacha", "apio", "puerro"
];

export function VoiceIngredientInput({ open, onClose, onIngredientsDetected }: VoiceIngredientInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [marcelaMessage, setMarcelaMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const { play: playSound } = useSound();
  const recognitionRef = useRef<any>(null);
  const isNative = Capacitor.isNativePlatform();

  // Check permissions and setup on mount
  useEffect(() => {
    const checkSupport = async () => {
      if (isNative) {
        try {
          // Check if speech recognition is available on native
          const available = await SpeechRecognition.available();
          setIsSupported(available.available);
          
          if (available.available) {
            // Check permissions
            const permResult = await SpeechRecognition.checkPermissions();
            setPermissionGranted(permResult.speechRecognition === 'granted');
          }
        } catch (error) {
          console.error("Error checking native speech recognition:", error);
          setIsSupported(false);
        }
      } else {
        // Web browser - check Web Speech API
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
          setIsSupported(false);
          return;
        }
        setPermissionGranted(true); // Web handles permissions differently

        const recognition = new SpeechRecognitionAPI();
        recognition.lang = "es-AR";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            finalTranscript += event.results[i][0].transcript;
          }
          setTranscript(finalTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          setMarcelaMessage("Ups, hubo un error. ¿Probamos de nuevo? 🎤");
        };

        recognition.onend = () => {
          // Will be handled by the listening state
        };

        recognitionRef.current = recognition;
      }
    };

    checkSupport();

    return () => {
      if (!isNative && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isNative]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTranscript("");
      setDetectedIngredients([]);
      setShowConfirmation(false);
      setMarcelaMessage("¡Presioná el micrófono y decime qué ingredientes tenés! 🎤");
    } else {
      stopListening();
    }
  }, [open]);

  const requestPermissions = async () => {
    if (isNative) {
      try {
        const result = await SpeechRecognition.requestPermissions();
        const granted = result.speechRecognition === 'granted';
        setPermissionGranted(granted);
        if (!granted) {
          setMarcelaMessage("Necesito permiso para usar el micrófono 🎤");
        }
        return granted;
      } catch (error) {
        console.error("Error requesting permissions:", error);
        return false;
      }
    }
    return true;
  };

  const startListening = async () => {
    // Request permissions if needed
    if (!permissionGranted) {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    try {
      if (isNative) {
        // Native platform - use Capacitor plugin
        await SpeechRecognition.start({
          language: "es-AR",
          maxResults: 5,
          popup: false,
          partialResults: true,
        });

        // Add listener for results
        SpeechRecognition.addListener("partialResults", (data: { matches: string[] }) => {
          if (data.matches && data.matches.length > 0) {
            setTranscript(data.matches[0]);
          }
        });

        setIsListening(true);
        setTranscript("");
        setMarcelaMessage("Te escucho... ¡Dale, contame qué hay en tu cocina! 👂");
        playSound("pop");
      } else {
        // Web browser
        if (!recognitionRef.current) return;
        
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript("");
        setMarcelaMessage("Te escucho... ¡Dale, contame qué hay en tu cocina! 👂");
        playSound("pop");
      }
    } catch (error) {
      console.error("Error starting recognition:", error);
      setMarcelaMessage("Ups, hubo un error al iniciar. ¿Probamos de nuevo? 🎤");
    }
  };

  const stopListening = useCallback(async () => {
    try {
      if (isNative) {
        await SpeechRecognition.stop();
        SpeechRecognition.removeAllListeners();
      } else if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error("Error stopping recognition:", error);
    }
    setIsListening(false);
  }, [isNative]);

  const processTranscript = async () => {
    await stopListening();
    
    if (!transcript.trim()) {
      setMarcelaMessage("No escuché nada... ¿Probamos de nuevo? 🤔");
      return;
    }

    // Detect ingredients from transcript
    const words = transcript.toLowerCase().split(/[\s,\.;]+/);
    const detected: string[] = [];
    
    // Check for known ingredients
    for (const keyword of INGREDIENT_KEYWORDS) {
      if (transcript.toLowerCase().includes(keyword) && !detected.includes(keyword)) {
        detected.push(keyword);
      }
    }
    
    // Also add any words that might be ingredients (3+ chars, not common words)
    const commonWords = ["tengo", "hay", "con", "sin", "para", "que", "una", "uno", "los", "las", "del", "algo", "poco", "mucho", "tambien", "ademas"];
    for (const word of words) {
      if (word.length >= 3 && !commonWords.includes(word) && !detected.includes(word)) {
        // Check if it looks like a potential ingredient
        const looksLikeIngredient = INGREDIENT_KEYWORDS.some(k => 
          k.includes(word) || word.includes(k.substring(0, 4))
        );
        if (looksLikeIngredient && detected.length < 15) {
          // Don't add duplicates or partial matches of already detected ones
          const alreadyHas = detected.some(d => d.includes(word) || word.includes(d));
          if (!alreadyHas) {
            detected.push(word);
          }
        }
      }
    }

    if (detected.length === 0) {
      setMarcelaMessage("No reconocí ingredientes... ¿Podrías repetirlo más claro? 🤔");
      return;
    }

    setDetectedIngredients(detected);
    setShowConfirmation(true);
    setMarcelaMessage(`¡Genial! Detecté ${detected.length} ingrediente${detected.length > 1 ? 's' : ''}. ¡Revisá y confirmá! ✨`);
    playSound("chime");
  };

  const removeDetectedIngredient = (ingredient: string) => {
    setDetectedIngredients(prev => prev.filter(i => i !== ingredient));
  };

  const confirmIngredients = () => {
    if (detectedIngredients.length > 0) {
      onIngredientsDetected(detectedIngredients);
      playSound("magic");
      setMarcelaMessage("¡Perfecto! Ya tengo tus ingredientes 🎉");
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const resetAndTryAgain = () => {
    setTranscript("");
    setDetectedIngredients([]);
    setShowConfirmation(false);
    setMarcelaMessage("¡Listo! Presioná el micrófono cuando quieras 🎤");
  };

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modo Voz no disponible</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <MicOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isNative 
                ? "El reconocimiento de voz no está disponible en tu dispositivo."
                : "Tu navegador no soporta reconocimiento de voz. Probá con Chrome o Edge."
              }
            </p>
          </div>
          <Button onClick={onClose} variant="secondary">Cerrar</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Modo Voz
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Marcela message */}
          <div className="flex items-start gap-3 bg-secondary/30 rounded-xl p-3">
            <img 
              src={marcelaImage} 
              alt="Marcela" 
              className="w-12 h-12 object-contain"
            />
            <p className="text-sm text-foreground flex-1 pt-2">
              {marcelaMessage}
            </p>
          </div>

          {/* Microphone button */}
          {!showConfirmation && (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={isListening ? processTranscript : startListening}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
                  isListening 
                    ? "bg-destructive text-destructive-foreground animate-pulse shadow-lg scale-110" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-card"
                )}
              >
                {isListening ? (
                  <div className="flex flex-col items-center">
                    <Mic className="w-8 h-8 animate-bounce" />
                    <span className="text-xs mt-1">Detener</span>
                  </div>
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>

              {isListening && (
                <div className="flex items-center gap-2 text-destructive">
                  <span className="w-2 h-2 bg-destructive rounded-full animate-ping" />
                  <span className="text-sm font-medium">Escuchando...</span>
                </div>
              )}

              {/* Live transcript */}
              {transcript && (
                <div className="w-full bg-card border border-border rounded-xl p-4 max-h-32 overflow-y-auto">
                  <p className="text-sm text-muted-foreground mb-1">Lo que escuché:</p>
                  <p className="text-foreground">{transcript}</p>
                </div>
              )}

              {transcript && !isListening && (
                <div className="flex gap-2">
                  <Button onClick={processTranscript} className="gap-2">
                    <Check className="w-4 h-4" />
                    Detectar ingredientes
                  </Button>
                  <Button onClick={resetAndTryAgain} variant="outline">
                    Reintentar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Confirmation view */}
          {showConfirmation && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Ingredientes detectados (podés eliminar los incorrectos):
                </p>
                <div className="flex flex-wrap gap-2">
                  {detectedIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
                        "bg-primary/10 text-primary border border-primary/20",
                        "text-sm font-medium capitalize"
                      )}
                    >
                      {ingredient}
                      <button
                        onClick={() => removeDetectedIngredient(ingredient)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                {detectedIngredients.length === 0 && (
                  <p className="text-muted-foreground text-sm italic">
                    No quedan ingredientes. Probá de nuevo.
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button onClick={resetAndTryAgain} variant="outline">
                  Volver a grabar
                </Button>
                <Button 
                  onClick={confirmIngredients} 
                  disabled={detectedIngredients.length === 0}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirmar ({detectedIngredients.length})
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
