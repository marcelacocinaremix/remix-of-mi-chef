import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, Save, Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createWorker } from "tesseract.js";
import { cn } from "@/lib/utils";

interface NutritionalInfo {
  calories?: number;
  total_fat?: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  sodium?: number;
  total_carbs?: number;
  dietary_fiber?: number;
  sugars?: number;
  protein?: number;
}

interface ProductScannerProps {
  open: boolean;
  onClose: () => void;
  onProductSaved: () => void;
}

export function ProductScanner({ open, onClose, onProductSaved }: ProductScannerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<"capture" | "processing" | "edit">("capture");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawText, setRawText] = useState("");
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo>({});
  const [isSaving, setIsSaving] = useState(false);

  const parseNutritionalInfo = (text: string): NutritionalInfo => {
    const info: NutritionalInfo = {};
    
    // Clean up text - normalize spaces and common OCR errors
    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/[oO](\d)/g, '0$1') // O followed by number -> 0
      .replace(/(\d)[lI]/g, '$11') // number followed by l or I -> 1
      .replace(/,(\d)/g, '.$1'); // comma before number -> decimal
    
    // More flexible patterns for nutritional values
    // Match: label ... number ... unit (with lots of flexibility)
    const patterns = [
      { 
        key: 'calories', 
        patterns: [
          /(?:valor\s*energ[eé]tico|calor[ií]as?|energ[ií]a)\s*[:\s]*(\d+(?:[.,]\d+)?)\s*(?:kcal|cal)?/gi,
          /(\d+(?:[.,]\d+)?)\s*(?:kcal|cal(?:or[ií]as?)?)/gi,
        ] 
      },
      { 
        key: 'total_fat', 
        patterns: [
          /(?:grasas?\s*totale?s?|l[ií]pidos?|total\s*fat|mat(?:eria)?\s*grasa)\s*[:\s]*(\d+(?:[.,]\d+)?)\s*g/gi,
          /(?:grasas?|fat)\s*[:\s]*(\d+(?:[.,]\d+)?)\s*g/gi,
        ] 
      },
      { 
        key: 'saturated_fat', 
        patterns: [
          /(?:grasas?\s*saturadas?|saturated|[aá]c(?:idos?)?\s*grasos?\s*sat)/gi,
          /saturad[ao]s?\s*[:\s]*(\d+(?:[.,]\d+)?)\s*g/gi,
        ] 
      },
      { 
        key: 'trans_fat', 
        patterns: [
          /(?:grasas?\s*trans|trans\s*fat)\s*[:\s]*(\d+(?:[.,]\d+)?)/gi,
        ] 
      },
      { 
        key: 'cholesterol', 
        patterns: [
          /colesterol\s*[:\s]*(\d+(?:[.,]\d+)?)\s*(?:mg)?/gi,
          /cholesterol\s*[:\s]*(\d+(?:[.,]\d+)?)\s*(?:mg)?/gi,
        ] 
      },
      { 
        key: 'sodium', 
        patterns: [
          /sodio\s*[:\s]*(\d+(?:[.,]\d+)?)\s*(?:mg)?/gi,
          /sodium\s*[:\s]*(\d+(?:[.,]\d+)?)\s*(?:mg)?/gi,
          /sal\s*[:\s]*(\d+(?:[.,]\d+)?)\s*(?:mg|g)?/gi,
        ] 
      },
      { 
        key: 'total_carbs', 
        patterns: [
          /(?:carbohidratos?|hidratos?\s*(?:de)?\s*carbono|carbs?|gluc[ií]dos?)\s*(?:totale?s?)?\s*[:\s]*(\d+(?:[.,]\d+)?)\s*g/gi,
        ] 
      },
      { 
        key: 'dietary_fiber', 
        patterns: [
          /fibra\s*(?:diet[eé]tica|alimentaria|total)?\s*[:\s]*(\d+(?:[.,]\d+)?)\s*g/gi,
          /fiber\s*[:\s]*(\d+(?:[.,]\d+)?)\s*g/gi,
        ] 
      },
      { 
        key: 'sugars', 
        patterns: [
          /az[uú]cares?\s*(?:totale?s?)?\s*[:\s]*(\d+(?:[.,]\d+)?)\s*g/gi,
          /sugars?\s*[:\s]*(\d+(?:[.,]\d+)?)\s*g/gi,
        ] 
      },
      { 
        key: 'protein', 
        patterns: [
          /prote[ií]nas?\s*[:\s]*(\d+(?:[.,]\d+)?)\s*g/gi,
          /protein\s*[:\s]*(\d+(?:[.,]\d+)?)\s*g/gi,
        ] 
      },
    ];

    patterns.forEach(({ key, patterns: regexPatterns }) => {
      for (const pattern of regexPatterns) {
        // Reset regex lastIndex for global patterns
        pattern.lastIndex = 0;
        const match = pattern.exec(cleanText);
        if (match && match[1]) {
          const value = parseFloat(match[1].replace(',', '.'));
          if (!isNaN(value) && value >= 0) {
            (info as any)[key] = value;
            break;
          }
        }
      }
    });

    return info;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Solo se permiten imágenes",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setImagePreview(imageData);
      await processImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageData: string) => {
    setStep("processing");
    setIsProcessing(true);

    try {
      const worker = await createWorker('spa+eng');
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      setRawText(text);
      const parsedInfo = parseNutritionalInfo(text);
      setNutritionalInfo(parsedInfo);
      setStep("edit");
      
      toast({
        title: "✅ Texto extraído",
        description: "Revisá y editá la información antes de guardar.",
      });
    } catch (error) {
      console.error("OCR Error:", error);
      toast({
        title: "Error al procesar",
        description: "No se pudo leer la imagen. Intentá con otra foto.",
        variant: "destructive",
      });
      setStep("capture");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Iniciá sesión",
        description: "Necesitás una cuenta para guardar productos.",
        variant: "destructive",
      });
      return;
    }

    if (!productName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Ingresá un nombre para el producto.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("scanned_products").insert({
        user_id: user.id,
        product_name: productName.trim(),
        brand: brand.trim() || null,
        serving_size: servingSize.trim() || null,
        calories: nutritionalInfo.calories || null,
        total_fat: nutritionalInfo.total_fat || null,
        saturated_fat: nutritionalInfo.saturated_fat || null,
        trans_fat: nutritionalInfo.trans_fat || null,
        cholesterol: nutritionalInfo.cholesterol || null,
        sodium: nutritionalInfo.sodium || null,
        total_carbs: nutritionalInfo.total_carbs || null,
        dietary_fiber: nutritionalInfo.dietary_fiber || null,
        sugars: nutritionalInfo.sugars || null,
        protein: nutritionalInfo.protein || null,
        raw_text: rawText,
      });

      if (error) throw error;

      toast({
        title: "✅ Producto guardado",
        description: `${productName} se agregó a tus productos escaneados.`,
      });
      
      onProductSaved();
      handleClose();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep("capture");
    setImagePreview(null);
    setRawText("");
    setProductName("");
    setBrand("");
    setServingSize("");
    setNutritionalInfo({});
    onClose();
  };

  const updateNutrition = (key: keyof NutritionalInfo, value: string) => {
    const numValue = parseFloat(value);
    setNutritionalInfo(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? undefined : numValue
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Escanear Producto
          </DialogTitle>
        </DialogHeader>

        {step === "capture" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tomá una foto de la tabla nutricional del producto para extraer la información automáticamente.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer",
                "transition-all hover:border-primary hover:bg-primary/5"
              )}
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Subir imagen</p>
              <p className="text-sm text-muted-foreground">
                Tocá para seleccionar una foto
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {step === "processing" && (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
            <p className="font-medium">Procesando imagen...</p>
            <p className="text-sm text-muted-foreground">
              Extrayendo información nutricional
            </p>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-4 max-h-32 mx-auto rounded-lg opacity-50"
              />
            )}
          </div>
        )}

        {step === "edit" && (
          <div className="space-y-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Producto"
                className="w-full max-h-32 object-contain rounded-lg bg-muted"
              />
            )}

            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium">Nombre del producto *</label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej: Galletas integrales"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Marca</label>
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej: Arcor"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Porción</label>
                  <Input
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    placeholder="Ej: 30g"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Información Nutricional
              </h4>
              <div className="space-y-2">
                {[
                  { key: 'calories', label: 'Calorías', unit: 'kcal', icon: '🔥' },
                  { key: 'protein', label: 'Proteínas', unit: 'g', icon: '💪' },
                  { key: 'total_carbs', label: 'Carbohidratos', unit: 'g', icon: '🍞' },
                  { key: 'sugars', label: 'Azúcares', unit: 'g', icon: '🍬' },
                  { key: 'total_fat', label: 'Grasas totales', unit: 'g', icon: '🧈' },
                  { key: 'saturated_fat', label: 'Grasas saturadas', unit: 'g', icon: '🥓' },
                  { key: 'dietary_fiber', label: 'Fibra dietética', unit: 'g', icon: '🥦' },
                  { key: 'sodium', label: 'Sodio', unit: 'mg', icon: '🧂' },
                ].map(({ key, label, unit, icon }) => (
                  <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <span className="text-base w-6 text-center">{icon}</span>
                    <label className="text-sm font-medium flex-1">{label}</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={nutritionalInfo[key as keyof NutritionalInfo] ?? ""}
                      onChange={(e) => updateNutrition(key as keyof NutritionalInfo, e.target.value)}
                      className="h-9 w-24 text-center text-sm"
                      placeholder="0"
                    />
                    <span className="text-xs text-muted-foreground w-10">{unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {rawText && (
              <details className="text-xs border rounded-lg p-2">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <Eye className="w-3 h-3" />
                  Ver texto extraído por OCR
                </summary>
                <div className="mt-2 p-3 bg-muted rounded text-xs font-mono whitespace-pre-wrap max-h-32 overflow-auto">
                  {rawText}
                </div>
                <p className="mt-2 text-muted-foreground italic">
                  💡 Si el OCR no detectó bien los valores, podés editarlos manualmente arriba.
                </p>
              </details>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Guardar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
