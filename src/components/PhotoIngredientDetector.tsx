import { useState, useRef } from "react";
import { Camera, Upload, X, Check, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PhotoIngredientDetectorProps {
  open: boolean;
  onClose: () => void;
  onIngredientsDetected: (ingredients: string[]) => void;
}

export function PhotoIngredientDetector({ open, onClose, onIngredientsDetected }: PhotoIngredientDetectorProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"capture" | "confirm">("capture");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Archivo inválido",
        description: "Por favor seleccioná una imagen.",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setDetectedIngredients([]);

    try {
      const { data, error } = await supabase.functions.invoke('detect-ingredients', {
        body: { imageBase64 }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      const ingredients = data.ingredients || [];
      setDetectedIngredients(ingredients);
      setSelectedIngredients(new Set(ingredients));
      setStep("confirm");

      if (ingredients.length === 0) {
        toast({
          title: "Sin ingredientes detectados",
          description: "No pude identificar ingredientes claros. Intentá con otra foto.",
        });
      } else {
        toast({
          title: `${ingredients.length} ingredientes detectados`,
          description: "Revisá y confirmá los ingredientes.",
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Error al analizar",
        description: error instanceof Error ? error.message : "No pude analizar la imagen.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleIngredient = (ingredient: string) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(ingredient)) {
      newSelected.delete(ingredient);
    } else {
      newSelected.add(ingredient);
    }
    setSelectedIngredients(newSelected);
  };

  const handleConfirm = () => {
    onIngredientsDetected(Array.from(selectedIngredients));
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setImagePreview(null);
    setDetectedIngredients([]);
    setSelectedIngredients(new Set());
    setStep("capture");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Modo Foto
          </DialogTitle>
          <DialogDescription>
            {step === "capture" 
              ? "Sacá una foto o subí una imagen de tus ingredientes"
              : "Confirmá los ingredientes detectados"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "capture" && !imagePreview && (
            <div className="flex flex-col gap-3">
              {/* Hidden inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Camera button */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => cameraInputRef.current?.click()}
                className="h-24 flex flex-col gap-2"
              >
                <Camera className="h-8 w-8 text-primary" />
                <span>Sacar foto</span>
              </Button>

              {/* Upload button */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="h-24 flex flex-col gap-2"
              >
                <Upload className="h-8 w-8 text-primary" />
                <span>Subir imagen</span>
              </Button>
            </div>
          )}

          {/* Image preview */}
          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium">Analizando imagen...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detected ingredients */}
          {step === "confirm" && detectedIngredients.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tocá para seleccionar/deseleccionar:
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedIngredients.map((ingredient) => (
                  <button
                    key={ingredient}
                    onClick={() => toggleIngredient(ingredient)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      selectedIngredients.has(ingredient)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground line-through"
                    )}
                  >
                    {selectedIngredients.has(ingredient) && (
                      <Check className="h-3 w-3" />
                    )}
                    {ingredient}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {step === "confirm" && (
              <>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Otra foto
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={selectedIngredients.size === 0}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Usar {selectedIngredients.size} ingredientes
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
